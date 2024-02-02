import { MigrationInterface, QueryRunner } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { bcryptPassword } from '../../utils/password.util';

export class SuperAdmin1699602140508 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const user = queryRunner.manager.getRepository(User).create({
      email: 'super@admin.com',
      password: await bcryptPassword('12345678'),
      admin: true,
      superAdmin: true,
    });
    await queryRunner.manager.getRepository(User).save(user);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const user = await queryRunner.manager.getRepository(User).findOne({
      where: {
        email: 'super@admin.com',
      },
    });

    if (user) {
      await queryRunner.manager.getRepository(User).remove(user);
    }
  }
}
