import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { GetPermissionQueryDto } from './dto/get-permission-query.dto';
import { GetPermissionRes } from './dto/response/get-permissions-res.dto';
import { PageMetaDto } from '../utils/dto/page-meta.dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(
    getPermissionDto: GetPermissionQueryDto,
  ): Promise<GetPermissionRes> {
    const { sort, sortField, take, skip } = getPermissionDto;
    const orderField: string = sortField || 'id';
    const orderDirection: string = sort || 'ASC';
    const [permissions, itemCount] =
      await this.permissionRepository.findAndCount({
        skip,
        take,
        order: {
          [orderField]: orderDirection,
        },
      });
    const pageMeta: PageMetaDto = new PageMetaDto({
      metaData: getPermissionDto,
      itemCount,
    });
    return { permissions, pageMeta };
  }

  async findOne(id: string): Promise<Permission> {
    const permission: Permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found!');
    }
    return permission;
  }
}
