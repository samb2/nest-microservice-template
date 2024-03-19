import {
  Entity,
  Column,
  OneToMany,
  PrimaryColumn,
  BeforeInsert,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { UsersRoles } from '../../auth/entities/users-roles.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => UsersRoles, (usersRoles) => usersRoles.role)
  userRoles: UsersRoles[];

  @BeforeInsert()
  generateId() {
    this.id = this.generateRandomId();
  }

  generateRandomId(): number {
    return Math.floor(Math.random() * 900000) + 100000;
  }
}
