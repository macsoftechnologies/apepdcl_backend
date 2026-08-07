import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
  ) {}

  async createNotification(staffId: number, title: string, message: string, complaintId?: number) {
    const notif = this.notifRepo.create({
      staff_id: staffId,
      title,
      message,
      complaint_id: complaintId,
    });
    return this.notifRepo.save(notif);
  }

  async getMyNotifications(staffId: number) {
    return this.notifRepo.find({
      where: { staff_id: staffId },
      order: { created_at: 'DESC' },
      take: 20,
    });
  }

  async markAsRead(staffId: number, notifId: number) {
    await this.notifRepo.update(
      { staff_id: staffId, notification_id: notifId },
      { is_read: true }
    );
    return { success: true };
  }

  async markAllAsRead(staffId: number) {
    await this.notifRepo.update(
      { staff_id: staffId, is_read: false },
      { is_read: true }
    );
    return { success: true };
  }
}
