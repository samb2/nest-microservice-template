import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BeforeInsert,
  UpdateDateColumn,
  CreateDateColumn,
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

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;

  @OneToMany(() => ResetPassword, (resetPassword) => resetPassword.user)
  resetPassword: ResetPassword[];

  @OneToMany(() => UsersRoles, (usersRoles) => usersRoles.user, {
    cascade: true,
  })
  @Exclude()
  userRoles: UsersRoles[];

  @BeforeInsert()
  async normalizeEmail() {
    this.email = this.email.toLowerCase();
  }
}
