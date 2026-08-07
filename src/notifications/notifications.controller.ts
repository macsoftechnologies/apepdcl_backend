import { Controller, Get, Patch, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Staff - Notifications')
@ApiBearerAuth()
@UseGuards(StaffAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Get()
  getMyNotifications(@Request() req: any) {
    return this.notifService.getMyNotifications(req.user.staff_id);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req: any) {
    return this.notifService.markAllAsRead(req.user.staff_id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.notifService.markAsRead(req.user.staff_id, id);
  }
}
