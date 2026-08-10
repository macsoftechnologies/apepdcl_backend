import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Complaint, ComplaintStatus } from './entities/complaint.entity';
import { ComplaintsPaginationDto } from './dto/complaints-pagination.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepo: Repository<Complaint>,
  ) {}

  async findAll(paginationDto: ComplaintsPaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      category_key,
      circle_id,
      division_id,
      subdivision_id,
      section_id,
      from_date,
      to_date,
    } = paginationDto;

    const skip = (page - 1) * limit;

    const query = this.complaintRepo
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.consumer', 'consumer')
      .leftJoinAndSelect('complaint.section', 'section')
      .leftJoinAndSelect('section.subdivision', 'subdivision')
      .leftJoinAndSelect('subdivision.division', 'division')
      .leftJoinAndSelect('division.circle', 'circle');

    if (status) {
      query.andWhere('complaint.status = :status', { status });
    }
    if (category_key) {
      query.andWhere('complaint.category_key = :category_key', {
        category_key,
      });
    }

    // Geography filters
    if (section_id) {
      query.andWhere('complaint.section_id = :section_id', { section_id });
    } else if (subdivision_id) {
      query.andWhere('section.subdivision_id = :subdivision_id', {
        subdivision_id,
      });
    } else if (division_id) {
      query.andWhere('subdivision.division_id = :division_id', { division_id });
    } else if (circle_id) {
      query.andWhere('division.circle_id = :circle_id', { circle_id });
    }

    if (from_date && to_date) {
      query.andWhere('complaint.created_at BETWEEN :start AND :end', {
        start: new Date(from_date),
        end: new Date(to_date),
      });
    } else if (from_date) {
      query.andWhere('complaint.created_at >= :start', {
        start: new Date(from_date),
      });
    } else if (to_date) {
      query.andWhere('complaint.created_at <= :end', {
        end: new Date(to_date),
      });
    }

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('complaint.ticket_number LIKE :search', {
            search: `%${search}%`,
          })
            .orWhere('consumer.mobile_number LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('consumer.full_name LIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    query.orderBy('complaint.created_at', 'DESC');
    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      message: 'Complaints fetched successfully',
    };
  }

  async findOne(id: number) {
    const complaint = await this.complaintRepo
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.consumer', 'consumer')
      .leftJoinAndSelect('complaint.section', 'section')
      .leftJoinAndSelect('section.subdivision', 'subdivision')
      .leftJoinAndSelect('subdivision.division', 'division')
      .leftJoinAndSelect('division.circle', 'circle')
      .leftJoinAndSelect('complaint.assigned_lineman', 'assigned_lineman')
      .leftJoinAndSelect('assigned_lineman.staff', 'lineman_staff')
      .where('complaint.complaint_id = :id', { id })
      .getOne();

    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }
    return complaint;
  }

  async updateStatus(
    id: number,
    updateDto: UpdateComplaintStatusDto,
    userId: number,
  ) {
    const complaint = await this.findOne(id);

    complaint.status = updateDto.status;

    if (updateDto.status === ComplaintStatus.ASSIGNED) {
      complaint.assigned_at = new Date();
      complaint.assigned_by = userId;
      if (updateDto.assigned_lineman_id) {
        complaint.assigned_lineman_id = updateDto.assigned_lineman_id;
      }
    } else if (updateDto.status === ComplaintStatus.WORKING) {
      complaint.working_at = new Date();
    } else if (updateDto.status === ComplaintStatus.RESOLVED) {
      complaint.resolved_at = new Date();
    }

    return await this.complaintRepo.save(complaint);
  }
}
