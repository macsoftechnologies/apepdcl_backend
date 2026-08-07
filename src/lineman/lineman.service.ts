import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint, ComplaintStatus } from '../complaints/entities/complaint.entity';
import { LinemanDetails, LinemanStatus } from '../staff/entities/lineman-details.entity';

@Injectable()
export class LinemanService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepo: Repository<Complaint>,
    @InjectRepository(LinemanDetails)
    private readonly linemanRepo: Repository<LinemanDetails>,
  ) {}

  async getAssignedComplaints(linemanId: number) {
    return this.complaintRepo.find({
      where: [
        { assigned_lineman_id: linemanId, status: ComplaintStatus.ASSIGNED },
        { assigned_lineman_id: linemanId, status: ComplaintStatus.WORKING },
      ],
      relations: { consumer: true, section: true },
      order: { created_at: 'DESC' },
    });
  }

  async updateComplaintStatus(
    linemanId: number,
    complaintId: number,
    status: ComplaintStatus,
    resolution_notes?: string,
    resolution_photo_url?: string,
  ) {
    const complaint = await this.complaintRepo.findOne({
      where: { complaint_id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    if (complaint.assigned_lineman_id !== linemanId) {
      throw new ForbiddenException('You are not assigned to this complaint');
    }

    if (complaint.status === ComplaintStatus.RESOLVED) {
      throw new BadRequestException('Complaint is already resolved and cannot be updated');
    }

    if (status === ComplaintStatus.RESOLVED) {
      if (!resolution_notes && !resolution_photo_url) {
        throw new BadRequestException('Resolution notes or photo is required to resolve a complaint');
      }
      complaint.resolution_notes = resolution_notes || null as any;
      complaint.resolution_photo_url = resolution_photo_url || null as any;
      complaint.resolved_at = new Date();
    } else if (status === ComplaintStatus.WORKING) {
      complaint.working_at = new Date();
    }

    complaint.status = status;
    return this.complaintRepo.save(complaint);
  }

  async updateAvailability(linemanId: number, status: LinemanStatus) {
    const details = await this.linemanRepo.findOne({ where: { lineman_id: linemanId } });
    if (!details) {
      throw new NotFoundException('Lineman details not found');
    }
    details.current_status = status;
    return this.linemanRepo.save(details);
  }
}
