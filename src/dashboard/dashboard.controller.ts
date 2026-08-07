import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@Query() filters: any) {
    return this.dashboardService.getStats(filters);
  }

  @Get('charts')
  getCharts(@Query() filters: any) {
    return this.dashboardService.getCharts(filters);
  }

  @Get('heatmap')
  getHeatmap(@Query() filters: any) {
    return this.dashboardService.getHeatmap(filters);
  }
}
