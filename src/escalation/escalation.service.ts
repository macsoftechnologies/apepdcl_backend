import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Complaint, ComplaintStatus } from '../complaints/entities/complaint.entity';
import { SettingsService } from '../config/settings.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name);

  constructor(
    @InjectRepository(Complaint)
    private complaintRepo: Repository<Complaint>,
    private settingsService: SettingsService,
    private notifService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleEscalations() {
    this.logger.log('Running Escalation Matrix check...');
    
    const minutesStr = await this.settingsService.getSetting('escalation_time_minutes');
    const limitMinutes = parseInt(minutesStr, 10) || 240;

    const limitDate = new Date();
    limitDate.setMinutes(limitDate.getMinutes() - limitMinutes);

    const staleComplaints = await this.complaintRepo.find({
      where: [
        { status: ComplaintStatus.ASSIGNED, assigned_at: LessThan(limitDate) },
        { status: ComplaintStatus.WORKING, assigned_at: LessThan(limitDate) }
      ],
    });

    if (staleComplaints.length === 0) {
      return;
    }

    this.logger.log(`Found ${staleComplaints.length} stale complaints. Escalating...`);

    for (const complaint of staleComplaints) {
      const oldLineman = complaint.assigned_lineman_id;
      const assignedBy = complaint.assigned_by;

      // Escalate
      complaint.status = ComplaintStatus.RAISED;
      complaint.assigned_lineman_id = null;
      complaint.assigned_at = null;
      
      await this.complaintRepo.save(complaint);

      // Notify the person who assigned it
      if (assignedBy) {
        await this.notifService.createNotification(
          assignedBy,
          'SLA Breached: Ticket Escalated',
          `Ticket ${complaint.ticket_number} was not resolved by the Lineman within ${limitMinutes} minutes and has been escalated back to your queue.`,
          complaint.complaint_id,
        );
      }
    }
  }
}
