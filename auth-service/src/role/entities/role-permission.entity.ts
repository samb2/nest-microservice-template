import {
  Entity,
  ManyToOne,
  JoinColumn,
  Unique,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Permission } from '../../permission/entities/permission.entity';
import { Role } from './role.entity';

@Unique(['role', 'permission'])
@Entity({ name: 'roles-permissions' })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid') // Specify 'uuid' type for the primary key
  id: string;

  @ManyToOne(() => Role, (role) => role.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
