import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RolePermission])],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
