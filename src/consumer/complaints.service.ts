import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from '../complaints/entities/complaint.entity';
import { CreateConsumerComplaintDto } from './dto/create-consumer-complaint.dto';
import { Consumer } from '../complaints/entities/consumer.entity';
import { StaffJurisdiction } from '../staff/entities/staff-jurisdiction.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ConsumerComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepo: Repository<Complaint>,
    @InjectRepository(Consumer)
    private readonly consumerRepo: Repository<Consumer>,
    @InjectRepository(StaffJurisdiction)
    private readonly staffJurisdictionRepo: Repository<StaffJurisdiction>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(consumerId: number, dto: CreateConsumerComplaintDto) {
    const consumer = await this.consumerRepo.findOne({ where: { consumer_id: consumerId } });
    if (!consumer) {
      throw new NotFoundException('Consumer not found');
    }

    let ticket_number = '';
    let isUnique = false;
    while (!isUnique) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
      ticket_number = `APD-${new Date().getFullYear()}-${randomSuffix}`;
      const existing = await this.complaintRepo.findOne({ where: { ticket_number }});
      if (!existing) {
        isUnique = true;
      }
    }

    const complaint = this.complaintRepo.create({
      ...dto,
      consumer_id: consumerId,
      section_id: consumer.section_id || 1, // Fallback to 1 if consumer has no section
      ticket_number,
    });

    try {
      const savedComplaint = await this.complaintRepo.save(complaint);
      
      // Notify the Section AE (if they exist)
      try {
        const aes = await this.staffJurisdictionRepo.find({
          where: { jurisdiction_level: 'Section', jurisdiction_id: savedComplaint.section_id }
        });
        for (const ae of aes) {
          await this.notificationsService.createNotification(
            ae.staff_id,
            'New Complaint Raised',
            `A new complaint #${savedComplaint.ticket_number} has been raised in your section.`,
            savedComplaint.complaint_id
          );
        }
      } catch (notifErr) {
        console.error('Failed to send notification for new complaint:', notifErr);
      }

      return savedComplaint;
    } catch (error: any) {
      require('fs').writeFileSync('c:/Shanmukha/apepdcl/backend/db_error.log', String(error) + '\n' + (error.stack || ''));
      throw error;
    }
  }

  async findAllMyComplaints(consumerId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.complaintRepo.findAndCount({
      where: { consumer_id: consumerId },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });
    
    const totalPages = Math.ceil(total / limit);
    
    return { 
      success: true, 
      message: 'Complaints fetched', 
      data: items,
      total,
      page,
      limit,
      totalPages
    };
  }

  async findOneMyComplaint(consumerId: number, complaintId: number) {
    const complaint = await this.complaintRepo.createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.section', 'section')
      .leftJoinAndSelect('section.subdivision', 'subdivision')
      .leftJoinAndSelect('subdivision.division', 'division')
      .leftJoinAndSelect('division.circle', 'circle')
      .where('complaint.complaint_id = :id', { id: complaintId })
      .andWhere('complaint.consumer_id = :consumerId', { consumerId })
      .getOne();

    if (!complaint) {
      throw new NotFoundException(`Complaint not found`);
    }

    return { success: true, message: 'Complaint details fetched', data: complaint };
  }
}
