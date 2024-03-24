import { MigrationInterface, QueryRunner } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export class SuperAdmin1710749911179 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get Repositories

    const userRepository = queryRunner.manager.getRepository(User);
    // Create Super Admin
    const user = userRepository.create({
      authId: '8ff287f8-f26f-49e7-b0ba-c13df26fef5f',
      email: 'super@admin.com',
      admin: true,
      superAdmin: true,
    });
    await queryRunner.manager.getRepository(User).save(user);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
