import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { HierarchyService } from './hierarchy.service';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Staff - Hierarchy')
@ApiBearerAuth()
@UseGuards(StaffAuthGuard)
@Controller('staff/hierarchy')
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get()
  async getHierarchy(@Request() req: any) {
    const staffId = req.user.staff_id;
    const isSuperAdmin = req.user.is_super_admin;
    
    const hierarchy = await this.hierarchyService.getHierarchyForStaff(staffId, isSuperAdmin);
    return {
      success: true,
      data: hierarchy,
    };
  }
}
