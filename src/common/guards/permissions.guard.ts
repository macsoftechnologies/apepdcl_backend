import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { StaffPermission } from '../../staff/entities/staff-permission.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(StaffPermission)
    private staffPermRepo: Repository<StaffPermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.staff_id) {
      throw new ForbiddenException('User is not authenticated as staff');
    }

    if (user.is_super_admin || user.role_level === 6) {
      return true;
    }

    const userPermissions = await this.staffPermRepo.find({
      where: { staff_id: user.staff_id },
    });

    const userPermissionKeys = userPermissions.map(p => p.permission_key);

    const hasPermission = requiredPermissions.every(rp => userPermissionKeys.includes(rp));
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}
