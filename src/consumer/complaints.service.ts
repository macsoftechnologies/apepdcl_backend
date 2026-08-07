import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from '../complaints/entities/complaint.entity';
import { CreateConsumerComplaintDto } from './dto/create-consumer-complaint.dto';
import { Consumer } from '../complaints/entities/consumer.entity';

@Injectable()
export class ConsumerComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepo: Repository<Complaint>,
    @InjectRepository(Consumer)
    private readonly consumerRepo: Repository<Consumer>,
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
      section_id: consumer.section_id,
      ticket_number,
    });

    return await this.complaintRepo.save(complaint);
  }

  async findAllMyComplaints(consumerId: number) {
    const items = await this.complaintRepo.find({
      where: { consumer_id: consumerId },
      order: { created_at: 'DESC' },
    });
    return { success: true, message: 'Complaints fetched', data: items };
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
