import { MigrationInterface, QueryRunner } from 'typeorm';
import { redisCommon } from '../redis.module';
import { Role } from '../../role/entities/role.entity';
import { RoleEnum } from '../../role/enum/role.enum';
import { PermissionEnum } from '../../permission/enum/permission.enum';
import { Permission } from '../../permission/entities/permission.entity';
import { RolePermission } from '../../role/entities/role-permission.entity';

export class RolePermission1710682402648 implements MigrationInterface {
  redisClient: any;

  constructor() {
    const { useFactory } = redisCommon;
    this.redisClient = useFactory();
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      // Get Repositories
      const roleRepository = queryRunner.manager.getRepository(Role);
      const permissionRepository =
        queryRunner.manager.getRepository(Permission);
      const rolePermissionRepository =
        queryRunner.manager.getRepository(RolePermission);
      // -----------------------------------
      const roles: Role[] = [];
      const permissions: Permission[] = [];

      // Save Roles & Permissions
      for (const roleEnumKey in RoleEnum) {
        roles.push(roleRepository.create({ name: RoleEnum[roleEnumKey] }));
      }
      for (const permissionEnumKey in PermissionEnum) {
        permissions.push(
          permissionRepository.create({
            access: PermissionEnum[permissionEnumKey],
          }),
        );
      }

      await roleRepository.save(roles);
      await permissionRepository.save(permissions);
      // ----------------------------------------------
      const rolePermissions: RolePermission[] = [];
      const redisAdminPermissions: any[] = [];
      const redisUserPermissions: any[] = [];
      let redisAdminKey: string;
      let redisUserKey: string;
      let redisSuperAdminKey: string;

      for (const role of roles) {
        // Super admin
        if (role.name === RoleEnum.SUPER_ADMIN) {
          redisSuperAdminKey = role.id.toString();
        }
        // Admin has all permissions
        if (role.name === RoleEnum.ADMIN) {
          redisAdminKey = role.id.toString();
          for (const permission of permissions) {
            if (
              PermissionEnum.MANAGE_ROLE === permission.access ||
              PermissionEnum.MANAGE_USER === permission.access ||
              PermissionEnum.MANAGE_FILE === permission.access ||
              PermissionEnum.MANAGE_PERMISSION === permission.access ||
              PermissionEnum.MANAGE_PROFILE === permission.access ||
              PermissionEnum.MANAGE_PROFILE_IMAGE === permission.access
            ) {
              rolePermissions.push(
                rolePermissionRepository.create({ role, permission }),
              );
              redisAdminPermissions.push(permission.access);
            }
          }
        }
        // User Permissions
        if (role.name === RoleEnum.USER) {
          redisUserKey = role.id.toString();
          for (const permission of permissions) {
            if (
              PermissionEnum.MANAGE_PROFILE_IMAGE === permission.access ||
              PermissionEnum.MANAGE_PROFILE === permission.access
            ) {
              rolePermissions.push(
                rolePermissionRepository.create({ role, permission }),
              );
              redisUserPermissions.push(permission.access);
            }
          }
        }
      }
      await rolePermissionRepository.save(rolePermissions);
      // Redis
      await this.redisClient.set(redisSuperAdminKey, JSON.stringify([]));
      await this.redisClient.set(
        redisAdminKey,
        JSON.stringify(redisAdminPermissions),
      );
      await this.redisClient.set(
        redisUserKey,
        JSON.stringify(redisUserPermissions),
      );
      // Commit the transaction if everything is successful
      await queryRunner.commitTransaction();
    } catch (e) {
      // Rollback the transaction if there's an error
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await this.redisClient.disconnect();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      // Get Repositories
      const roleRepository = queryRunner.manager.getRepository(Role);
      const permissionRepository =
        queryRunner.manager.getRepository(Permission);
      const rolePermissionRepository =
        queryRunner.manager.getRepository(RolePermission);

      // Delete Role-Permission Associations
      await rolePermissionRepository.clear();

      // Delete Permissions
      await permissionRepository.clear();

      // Delete Roles
      await roleRepository.clear();

      // Redis
      this.redisClient.flushall();

      // Commit the transaction if everything is successful
      await queryRunner.commitTransaction();
    } catch (e) {
      // Rollback the transaction if there's an error
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await this.redisClient.disconnect();
    }
  }
}
