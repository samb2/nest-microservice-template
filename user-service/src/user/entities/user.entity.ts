import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid') // Specify 'uuid' type for the primary key
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'auth_id', unique: true })
  authId: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

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
}
