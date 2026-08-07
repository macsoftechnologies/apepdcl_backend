import { Controller, Get, Patch, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { LinemanService } from './lineman.service';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ComplaintStatus } from '../complaints/entities/complaint.entity';
import { LinemanStatus } from '../staff/entities/lineman-details.entity';

@ApiTags('Lineman APIs')
@ApiBearerAuth()
@UseGuards(StaffAuthGuard, PermissionsGuard)
@Controller('lineman')
export class LinemanController {
  constructor(private readonly linemanService: LinemanService) {}

  @Get('complaints')
  @RequirePermissions('VIEW_ASSIGNED_COMPLAINTS')
  getAssignedComplaints(@Request() req: any) {
    if (!req.user.lineman_id) {
      throw new BadRequestException('User is not provisioned as a lineman');
    }
    return this.linemanService.getAssignedComplaints(req.user.lineman_id);
  }

  @Patch('complaints/:id/status')
  @RequirePermissions('UPDATE_COMPLAINT_STATUS')
  updateComplaintStatus(
    @Param('id') id: string,
    @Body('status') status: ComplaintStatus,
    @Body('resolution_notes') resolution_notes: string,
    @Body('resolution_photo_url') resolution_photo_url: string,
    @Request() req: any
  ) {
    if (!req.user.lineman_id) {
      throw new BadRequestException('User is not provisioned as a lineman');
    }
    return this.linemanService.updateComplaintStatus(
      req.user.lineman_id,
      +id,
      status,
      resolution_notes,
      resolution_photo_url,
    );
  }

  @Patch('status')
  @RequirePermissions('UPDATE_COMPLAINT_STATUS') // Can reuse or make a new permission
  updateAvailability(@Body('status') status: LinemanStatus, @Request() req: any) {
    if (!req.user.lineman_id) {
      throw new BadRequestException('User is not provisioned as a lineman');
    }
    return this.linemanService.updateAvailability(req.user.lineman_id, status);
  }
}
