import { MigrationInterface, QueryRunner, Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';

const authId: string = '8ff287f8-f26f-49e7-b0ba-c13df26fef5f';

export class SuperAdmin1710749911179 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get Repositories
    const userRepository: Repository<User> =
      queryRunner.manager.getRepository(User);
    // Create Super Admin
    const user: User = userRepository.create({
      authId,
      email: 'super@admin.com',
      admin: true,
      superAdmin: true,
    });
    await userRepository.save(user);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get Repositories
    const userRepository: Repository<User> =
      queryRunner.manager.getRepository(User);
    // Find Super Admin by authId
    const superAdmin: User = await userRepository.findOne({
      where: { authId },
    });

    if (superAdmin) {
      // Delete Super Admin
      await userRepository.remove(superAdmin);
    }
  }
}
