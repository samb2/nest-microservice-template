import { MigrationInterface, QueryRunner } from 'typeorm';
import { UsersRoles } from '../../auth/entities/users-roles.entity';
import { Role } from '../../role/entities/role.entity';
import { User } from '../../auth/entities/user.entity';
import { bcryptPassword } from '../../utils/password.util';
import { RoleEnum } from '../../role/enum/role.enum';

export class SuperAdmin1710749321762 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get Repositories
    const userRolesRepository = queryRunner.manager.getRepository(UsersRoles);
    const rolesRepository = queryRunner.manager.getRepository(Role);
    const userRepository = queryRunner.manager.getRepository(User);
    // Create Super Admin
    const user = userRepository.create({
      id: '8ff287f8-f26f-49e7-b0ba-c13df26fef5f',
      email: 'super@admin.com',
      password: await bcryptPassword('12345678'),
      admin: true,
      superAdmin: true,
    });
    await queryRunner.manager.getRepository(User).save(user);
    // -----------------------------------
    // Get Super Admin Role
    const role = await rolesRepository.findOne({
      where: {
        name: RoleEnum.SUPER_ADMIN,
      },
    });
    // -----------------------------------
    // create UserRole
    const userRole: UsersRoles = userRolesRepository.create({
      user,
      role,
    });
    await userRolesRepository.save(userRole);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get Repositories
    const userRolesRepository = queryRunner.manager.getRepository(UsersRoles);
    const userRepository = queryRunner.manager.getRepository(User);

    // Find Super Admin User
    const user = await userRepository.findOne({
      where: {
        email: 'super@admin.com',
        admin: true,
        superAdmin: true,
      },
    });

    if (user) {
      // Delete UserRole
      await userRolesRepository.delete({ user });

      // Delete Super Admin User
      await userRepository.delete(user.id);
    }
  }
}
