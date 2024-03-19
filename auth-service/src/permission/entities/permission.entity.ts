import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PermissionEnum } from '../enum/permission.enum';
import { RolePermission } from '../../role/entities/role-permission.entity';

@Entity({ name: 'permissions' })
export class Permission {
  @PrimaryGeneratedColumn('uuid') // Specify 'uuid' type for the primary key
  id: string;

  @Column({ type: 'enum', enum: PermissionEnum })
  access: PermissionEnum;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: RolePermission[];
}
