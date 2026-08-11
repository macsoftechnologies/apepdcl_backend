import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { StaffDashboardService } from './staff-dashboard.service';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Staff - Dashboard')
@ApiBearerAuth()
@UseGuards(StaffAuthGuard)
@Controller('dashboard/staff')
export class StaffDashboardController {
  constructor(private readonly staffDashboardService: StaffDashboardService) {}

  @Get()
  getDashboardStats(
    @Request() req: any,
    @Query('level') level?: string,
    @Query('id') id?: string,
  ) {
    return this.staffDashboardService.getDashboardStats(
      req.user.staff_id, 
      req.user.is_super_admin, 
      req.user.role_level,
      level as any,
      id ? parseInt(id, 10) : undefined
    );
  }

  @Get('location-breakdown')
  getLocationBreakdown(
    @Request() req: any,
    @Query('level') level?: string,
    @Query('id') id?: string,
  ) {
    return this.staffDashboardService.getLocationBreakdown(
      req.user.staff_id, 
      req.user.is_super_admin, 
      req.user.role_level,
      level as any,
      id ? parseInt(id, 10) : undefined
    );
  }
}
