import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { StaffDashboardService } from './staff-dashboard.service';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Staff - Dashboard')
@ApiBearerAuth()
@UseGuards(StaffAuthGuard)
@Controller('staff/dashboard')
export class StaffDashboardController {
  constructor(private readonly staffDashboardService: StaffDashboardService) {}

  @Get()
  getDashboardStats(@Request() req: any) {
    return this.staffDashboardService.getDashboardStats(req.user.staff_id);
  }
}
