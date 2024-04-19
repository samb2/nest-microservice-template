import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Permission } from '../permission/entities/permission.entity';
import { User } from '../auth/entities/user.entity';
import { UsersRoles } from '../auth/entities/users-roles.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      RolePermission,
      Permission,
      User,
      UsersRoles,
    ]),
  ],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
