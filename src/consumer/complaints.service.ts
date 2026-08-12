import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from '../complaints/entities/complaint.entity';
import { CreateConsumerComplaintDto } from './dto/create-consumer-complaint.dto';
import { Consumer } from '../complaints/entities/consumer.entity';
import { StaffJurisdiction, JurisdictionLevel } from '../staff/entities/staff-jurisdiction.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Brackets } from 'typeorm';

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
      
      // Fetch full hierarchy to notify AE, ADE, DE
      try {
        const fullComplaint = await this.complaintRepo.findOne({
          where: { complaint_id: savedComplaint.complaint_id },
          relations: {
            section: {
              subdivision: {
                division: true
              }
            }
          }
        });

        if (fullComplaint && fullComplaint.section) {
          const sectionId = fullComplaint.section.section_id;
          const subdivId = fullComplaint.section.subdivision_id;
          const divId = fullComplaint.section.subdivision.division_id;

          const staffToNotify = await this.staffJurisdictionRepo.createQueryBuilder('jurisdiction')
            .leftJoin('jurisdiction.staff', 'staff')
            .leftJoin('staff.designation', 'designation')
            .where('designation.role_level > 1') // Exclude linemen
            .andWhere(new Brackets(qb => {
              qb.where('jurisdiction.jurisdiction_level = :sectionLevel AND jurisdiction.jurisdiction_id = :sectionId', { 
                sectionLevel: JurisdictionLevel.SECTION, sectionId: sectionId 
              })
              .orWhere('jurisdiction.jurisdiction_level = :subdivLevel AND jurisdiction.jurisdiction_id = :subdivId', { 
                subdivLevel: JurisdictionLevel.SUBDIVISION, subdivId: subdivId 
              })
              .orWhere('jurisdiction.jurisdiction_level = :divLevel AND jurisdiction.jurisdiction_id = :divId', { 
                divLevel: JurisdictionLevel.DIVISION, divId: divId 
              });
            }))
            .getMany();

          // Deduplicate staff_ids just in case one person covers multiple levels
          const uniqueStaffIds = [...new Set(staffToNotify.map(j => j.staff_id))];

          for (const staffId of uniqueStaffIds) {
            await this.notificationsService.createNotification(
              staffId,
              'New Complaint Raised',
              `A new complaint #${savedComplaint.ticket_number} has been raised in your jurisdiction.`,
              savedComplaint.complaint_id
            );
          }
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
      .leftJoinAndSelect('complaint.assigned_lineman', 'assigned_lineman')
      .leftJoinAndSelect('assigned_lineman.staff', 'lineman_staff')
      .where('complaint.complaint_id = :id', { id: complaintId })
      .andWhere('complaint.consumer_id = :consumerId', { consumerId })
      .getOne();

    if (!complaint) {
      throw new NotFoundException(`Complaint not found`);
    }

    return { success: true, message: 'Complaint details fetched', data: complaint };
  }
}
