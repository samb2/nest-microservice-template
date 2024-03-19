import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ResetPassword } from './reset-password.entity';
import { UsersRoles } from './users-roles.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid') // Specify 'uuid' type for the primary key
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: 'is_active', default: true })
  @Exclude()
  isActive: boolean;

  @Column({ name: 'is_delete', default: false })
  @Exclude()
  isDelete: boolean;

  @Column({ name: 'super_admin', default: false })
  @Exclude()
  superAdmin: boolean;

  @Column({ default: false })
  @Exclude()
  admin: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @OneToMany(() => ResetPassword, (resetPassword) => resetPassword.user)
  resetPassword: ResetPassword[];

  @OneToMany(() => UsersRoles, (usersRoles) => usersRoles.user)
  @Exclude()
  userRoles: UsersRoles[];

  @BeforeInsert()
  async normalizeEmail() {
    this.email = this.email.toLowerCase();
  }
}
