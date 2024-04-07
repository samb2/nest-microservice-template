import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from '../role/entities/role-permission.entity';
import { redisCommonFactory } from '../redis/redis-client.factory';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, RolePermission])],
  controllers: [PermissionController],
  providers: [PermissionService, redisCommonFactory],
})
export class PermissionModule {}
