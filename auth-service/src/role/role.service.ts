import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, QueryRunner, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permission/entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { createTransaction } from '../utils/create-transaction.util';
import Redis from 'ioredis';
import { PermissionEnum } from '@irole/microservices';
import { User } from '../auth/entities/user.entity';
import { UsersRoles } from '../auth/entities/users-roles.entity';
import { GetRoleDto } from './dto/get-role.dto';
import { PageMetaDto } from '../utils/page-meta.dto';
import { DeleteRoleResDto } from './dto/response/delete-role-res.dto';
import { DeleteRoleUserResDto } from './dto/response/delete-role-user-res.dto';

@Injectable()
export class RoleService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UsersRoles)
    private readonly usersRolesRepository: Repository<UsersRoles>,
    @Inject('RedisCommon') private readonly redisCommon: Redis,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const queryRunner: QueryRunner = await createTransaction(this.dataSource);
    const roleRep = queryRunner.manager.getRepository(Role);
    const permissionRep = queryRunner.manager.getRepository(Permission);
    const rolePermissionRep = queryRunner.manager.getRepository(RolePermission);
    try {
      const roleExist: Role = await roleRep.findOne({
        where: { name: createRoleDto.name },
      });
      if (roleExist) {
        throw new ConflictException('Role already exists!');
      }

      const role: Role = roleRep.create({
        name: createRoleDto.name,
        description: createRoleDto.description,
      });
      await roleRep.save(role);

      if (
        createRoleDto.permissionIds &&
        createRoleDto.permissionIds.length > 0
      ) {
        // Find duplicates in the rolePermissions array
        const duplicates: string[] = createRoleDto.permissionIds.filter(
          (item, index) => createRoleDto.permissionIds.indexOf(item) < index,
        );

        // Check if there are any duplicates
        if (duplicates.length > 0) {
          throw new BadRequestException(
            `Duplicated permission IDs found: ${duplicates.join(', ')}`,
          );
        }

        // Fetch and associate permissions in parallel
        const permissions: Permission[] = await permissionRep.find({
          select: { id: true, access: true },
          where: {
            id: In(createRoleDto.permissionIds),
          },
        });
        // Collect the IDs of permissions that were not found
        const notFoundPermissions: string[] =
          createRoleDto.permissionIds.filter(
            (id) => !permissions.some((permission) => permission.id === id),
          );

        if (notFoundPermissions.length > 0) {
          throw new NotFoundException(
            `Permissions with IDs ${notFoundPermissions.join(', ')} not found.`,
          );
        }

        const rolePermissions: RolePermission[] = permissions.map(
          (permission) => {
            return rolePermissionRep.create({
              role: { id: role.id },
              permission: { id: permission.id },
            });
          },
        );
        await rolePermissionRep.save(rolePermissions);
        // Save Role to Redis Common
        const redisPermissions: PermissionEnum[] = permissions.map(
          (permission) => permission.access,
        );

        await this.redisCommon.set(
          role.id.toString(),
          JSON.stringify(redisPermissions),
        );
      }

      await queryRunner.commitTransaction();
      return role;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    getRoleDto: GetRoleDto,
  ): Promise<{ roles: Role[]; pageMeta: PageMetaDto }> {
    const { sort, sortField, take, skip } = getRoleDto;
    const orderField: string = sortField || 'id';
    const orderDirection: string = sort || 'ASC';
    const [roles, itemCount] = await this.roleRepository.findAndCount({
      where: {
        name: Not('super admin'),
      },
      skip,
      take,
      order: {
        [orderField]: orderDirection,
      },
    });
    const pageMeta: PageMetaDto = new PageMetaDto({
      metaData: getRoleDto,
      itemCount,
    });
    return { roles, pageMeta };
  }

  async findOne(id: number): Promise<Role> {
    const role: Role = await this.roleRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
    if (!role) {
      throw new NotFoundException(`Role not found!`);
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const queryRunner: QueryRunner = await createTransaction(this.dataSource);
    const roleRep: Repository<Role> = queryRunner.manager.getRepository(Role);
    const permissionRep: Repository<Permission> =
      queryRunner.manager.getRepository(Permission);
    const rolePermissionRep: Repository<RolePermission> =
      queryRunner.manager.getRepository(RolePermission);

    try {
      const role: Role = await roleRep.findOne({
        where: { id },
      });
      if (!role) {
        throw new NotFoundException(`Role not found.`);
      }

      const { name, description, permissionIds } = updateRoleDto;
      // Update role properties
      const roleExist: Role = await roleRep.findOne({
        where: { name, id: Not(id) },
      });
      if (roleExist) {
        throw new ConflictException('Role Name already Exist');
      }
      role.name = name ?? role.name;
      role.description = description ?? role.description;
      if (permissionIds && permissionIds.length > 0) {
        // Remove existing role permissions
        await rolePermissionRep.delete({ role: { id } });
        await this.redisCommon.del(role.id.toString());
        //---------------------------------
        // Find duplicates in the rolePermissions array
        const duplicates: string[] = permissionIds.filter(
          (item, index) => permissionIds.indexOf(item) < index,
        );

        if (duplicates.length > 0) {
          throw new BadRequestException(
            `Duplicated permission IDs found: ${duplicates.join(', ')}`,
          );
        }
        //-----------------------------------------------
        // Collect the IDs of permissions that were not found
        const permissions: Permission[] = await permissionRep.find({
          select: { id: true, access: true },
          where: {
            id: In(permissionIds),
          },
        });

        const notFoundPermissions: string[] = permissionIds.filter(
          (id) => !permissions.some((permission) => permission.id === id),
        );

        if (notFoundPermissions.length > 0) {
          throw new NotFoundException(
            `Permissions with IDs ${notFoundPermissions.join(', ')} not found.`,
          );
        }
        //------------------------------------------------
        // ----------- Add RolePermission ---------------
        role.rolePermissions = permissions.map((permission) => {
          return rolePermissionRep.create({
            role: { id: role.id },
            permission,
          });
        });

        const redisPermissions: PermissionEnum[] = permissions.map(
          (permission) => permission.access,
        );
        await this.redisCommon.set(
          role.id.toString(),
          JSON.stringify(redisPermissions),
        );
        //-----------------------------------------------
      }
      await roleRep.save(role);
      await queryRunner.commitTransaction();
      return role;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<DeleteRoleResDto> {
    const queryRunner: QueryRunner = await createTransaction(this.dataSource);
    const roleRep: Repository<Role> = queryRunner.manager.getRepository(Role);

    try {
      const role: Role = await roleRep.findOne({
        where: { id },
        relations: ['rolePermissions', 'rolePermissions.permission'],
      });

      if (!role) {
        throw new NotFoundException(`Role not found.`);
      }
      await roleRep.delete({ id });
      // Delete Role In Redis Common
      await this.redisCommon.del(role.id.toString());
      await queryRunner.commitTransaction();
      return { message: `Role deleted successfully` };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  // Todo set query for isActive & isDelete
  async getUserRoles(userId: string): Promise<User> {
    const user: User = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        isDelete: true,
        userRoles: { id: true, role: { id: true, name: true } },
      },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) {
      throw new NotFoundException('user not found!');
    }
    return user;
  }

  async assignRoleToUser(id: number, userId: string): Promise<UsersRoles> {
    const role: Role = await this.roleRepository.findOne({
      where: { id },
      select: { id: true, name: true },
    });

    if (!role) {
      throw new NotFoundException('role not found!');
    }

    const user: User = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        isDelete: true,
      },
    });

    if (!user) {
      throw new NotFoundException('user not found!');
    }

    const usersRolesExist: UsersRoles = await this.usersRolesRepository.findOne(
      {
        where: {
          role,
          user,
        },
      },
    );

    if (usersRolesExist) {
      throw new ConflictException('this role already assigned to this user!');
    }

    const usersRoles: UsersRoles = this.usersRolesRepository.create({
      role,
      user,
    });
    await this.usersRolesRepository.save(usersRoles);
    return usersRoles;
  }

  async deleteUserRole(
    id: number,
    userId: string,
  ): Promise<DeleteRoleUserResDto> {
    const role: Role = await this.roleRepository.findOne({
      where: { id },
      select: { id: true, name: true },
    });

    if (!role) {
      throw new NotFoundException('role not found!');
    }

    const user: User = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        isDelete: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const usersRolesExist: UsersRoles = await this.usersRolesRepository.findOne(
      {
        where: {
          role,
          user,
        },
      },
    );

    if (!usersRolesExist) {
      throw new NotFoundException('This role not assigned to this user!');
    }

    await this.usersRolesRepository.remove(usersRolesExist);

    return {
      message: `This action removes a #${role.name} role from ${user.email}`,
    };
  }
}
