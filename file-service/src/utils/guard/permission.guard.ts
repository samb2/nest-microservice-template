// permission.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Redis from 'ioredis';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('RedisCommon') private readonly redisCommon: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );
    if (!permission) {
      return true;
    }
    const req = context.switchToHttp().getRequest();
    if (req.user.superAdmin) {
      return true;
    }
    const roles: number[] = req.roles;
    const userPermissions: string[] = [];
    for (const role of roles) {
      const redisPermissions: string = await this.redisCommon.get(
        role.toString(),
      );
      const permissions: any[] = JSON.parse(redisPermissions);
      for (const permission1 of permissions) {
        userPermissions.push(permission1);
      }
    }
    const accessName: string = permission.split('_')[1];
    const manage: string = `manage_${accessName}`;
    if (userPermissions.includes(manage)) {
      return true;
    }
    if (userPermissions.includes(permission)) {
      return true;
    }
    return false;
  }
}
