import { Controller, Get, Patch, Query, Param, Body, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { StaffComplaintsService } from './staff-complaints.service';
import { ComplaintsPaginationDto } from './dto/complaints-pagination.dto';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Staff - Complaints')
@ApiBearerAuth()
@UseGuards(StaffAuthGuard, PermissionsGuard)
@Controller('staff/complaints')
export class StaffComplaintsController {
  constructor(private readonly staffComplaintsService: StaffComplaintsService) {}

  @Get()
  findAll(@Query() paginationDto: ComplaintsPaginationDto, @Request() req: any) {
    return this.staffComplaintsService.findAllForStaff(req.user.staff_id, req.user.is_super_admin, req.user.role_level, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.staffComplaintsService.findOneForStaff(req.user.staff_id, req.user.is_super_admin, req.user.role_level, id);
  }

  @Patch(':id/assign')
  @RequirePermissions('ASSIGN_LINEMAN')
  assignLineman(@Param('id', ParseIntPipe) id: number, @Body('lineman_id') lineman_id: number, @Request() req: any) {
    return this.staffComplaintsService.assignLineman(req.user.staff_id, req.user.is_super_admin, req.user.role_level, id, lineman_id);
  }

  @Patch(':id/status')
  @RequirePermissions('UPDATE_COMPLAINT_STATUS')
  updateStatus(
    @Param('id', ParseIntPipe) id: number, 
    @Body('status') status: any, 
    @Body('resolution_notes') resolution_notes: string,
    @Body('resolution_photo_url') resolution_photo_url: string,
    @Body('resolution_document_url') resolution_document_url: string,
    @Body('resolution_gps_lat') resolution_gps_lat: number,
    @Body('resolution_gps_lng') resolution_gps_lng: number,
    @Request() req: any
  ) {
    return this.staffComplaintsService.updateStatus(
      req.user.staff_id, 
      req.user.is_super_admin, 
      req.user.role_level, 
      id, 
      status,
      resolution_notes,
      resolution_photo_url,
      resolution_document_url,
      resolution_gps_lat,
      resolution_gps_lng
    );
  }
}
