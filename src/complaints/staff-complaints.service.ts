import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Complaint, ComplaintStatus } from './entities/complaint.entity';
import { ComplaintsPaginationDto } from './dto/complaints-pagination.dto';
import { StaffJurisdiction, JurisdictionLevel } from '../staff/entities/staff-jurisdiction.entity';

@Injectable()
export class StaffComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepo: Repository<Complaint>,
    @InjectRepository(StaffJurisdiction)
    private readonly jurisdictionRepo: Repository<StaffJurisdiction>,
  ) {}

  async findAllForStaff(staffId: number, isSuperAdmin: boolean, roleLevel: number, paginationDto: ComplaintsPaginationDto) {
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

    const jurisdictions = await this.jurisdictionRepo.find({
      where: { staff_id: staffId },
    });

    const query = this.complaintRepo
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.consumer', 'consumer')
      .leftJoinAndSelect('complaint.section', 'section')
      .leftJoinAndSelect('section.subdivision', 'subdivision')
      .leftJoinAndSelect('subdivision.division', 'division')
      .leftJoinAndSelect('division.circle', 'circle');

    // Apply Jurisdiction Scoping
    if (!isSuperAdmin && roleLevel !== 1) { // 1 = Lineman
      if (jurisdictions.length === 0) {
        // If no jurisdictions, return empty
        query.andWhere('1 = 0');
      } else {
        query.andWhere(
          new Brackets((qb) => {
            jurisdictions.forEach((j, index) => {
              const condition = this.getJurisdictionCondition(j.jurisdiction_level, j.jurisdiction_id);
              if (index === 0) {
                qb.where(condition.sql, condition.params);
              } else {
                qb.orWhere(condition.sql, condition.params);
              }
            });
          }),
        );
      }
    } else if (roleLevel === 1) {
      // Lineman: fetch lineman_id and filter by assigned_lineman_id
      const lineman = await query.manager.query(
        'SELECT lineman_id FROM linemen_details WHERE staff_id = ?',
        [staffId]
      );
      if (lineman.length === 0) {
         query.andWhere('1 = 0'); // No lineman mapping found
      } else {
         query.andWhere('complaint.assigned_lineman_id = :linemanId', { linemanId: lineman[0].lineman_id });
      }
    }

    if (status) {
      query.andWhere('complaint.status = :status', { status });
    }
    if (category_key) {
      query.andWhere('complaint.category_key = :category_key', { category_key });
    }

    if (section_id) {
      query.andWhere('complaint.section_id = :section_id', { section_id });
    } else if (subdivision_id) {
      query.andWhere('section.subdivision_id = :subdivision_id', { subdivision_id });
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
    }

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('complaint.ticket_number LIKE :search', { search: `%${search}%` })
            .orWhere('consumer.mobile_number LIKE :search', { search: `%${search}%` })
            .orWhere('consumer.full_name LIKE :search', { search: `%${search}%` });
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
      message: 'Staff complaints fetched successfully',
    };
  }

  async findOneForStaff(staffId: number, isSuperAdmin: boolean, roleLevel: number, id: number) {
    const jurisdictions = await this.jurisdictionRepo.find({
      where: { staff_id: staffId },
    });

    const query = this.complaintRepo
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.consumer', 'consumer')
      .leftJoinAndSelect('complaint.section', 'section')
      .leftJoinAndSelect('section.subdivision', 'subdivision')
      .leftJoinAndSelect('subdivision.division', 'division')
      .leftJoinAndSelect('division.circle', 'circle')
      .leftJoinAndSelect('complaint.assigned_lineman', 'assigned_lineman')
      .leftJoinAndSelect('assigned_lineman.staff', 'lineman_staff')
      .where('complaint.complaint_id = :id', { id });

    if (!isSuperAdmin && roleLevel !== 1) {
      if (jurisdictions.length === 0) {
        throw new NotFoundException(`Complaint with ID ${id} not found in your jurisdiction`);
      }

      query.andWhere(
        new Brackets((qb) => {
          jurisdictions.forEach((j, index) => {
            const condition = this.getJurisdictionCondition(j.jurisdiction_level, j.jurisdiction_id);
            if (index === 0) {
              qb.where(condition.sql, condition.params);
            } else {
              qb.orWhere(condition.sql, condition.params);
            }
          });
        }),
      );
    } else if (roleLevel === 1) {
      const lineman = await query.manager.query(
        'SELECT lineman_id FROM linemen_details WHERE staff_id = ?',
        [staffId]
      );
      if (lineman.length === 0) {
         throw new NotFoundException(`Complaint with ID ${id} not found (Lineman details missing)`);
      }
      query.andWhere('complaint.assigned_lineman_id = :linemanId', { linemanId: lineman[0].lineman_id });
    }

    const complaint = await query.getOne();
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found in your jurisdiction`);
    }

    return complaint;
  }

  async assignLineman(staffId: number, isSuperAdmin: boolean, roleLevel: number, complaintId: number, linemanId: number) {
    const complaint = await this.findOneForStaff(staffId, isSuperAdmin, roleLevel, complaintId);
    
    complaint.assigned_lineman_id = linemanId;
    complaint.assigned_by = staffId;
    complaint.status = ComplaintStatus.ASSIGNED;
    complaint.assigned_at = new Date();

    return this.complaintRepo.save(complaint);
  }

  async updateStatus(staffId: number, isSuperAdmin: boolean, roleLevel: number, complaintId: number, status: ComplaintStatus) {
    const complaint = await this.findOneForStaff(staffId, isSuperAdmin, roleLevel, complaintId);
    
    complaint.status = status;
    
    if (status === ComplaintStatus.RESOLVED) {
      complaint.resolved_at = new Date();
    }

    return this.complaintRepo.save(complaint);
  }

  private getJurisdictionCondition(level: JurisdictionLevel, id: number) {
    const paramName = `jur_${level}_${id}`;
    switch (level) {
      case JurisdictionLevel.CIRCLE:
        return { sql: `division.circle_id = :${paramName}`, params: { [paramName]: id } };
      case JurisdictionLevel.DIVISION:
        return { sql: `subdivision.division_id = :${paramName}`, params: { [paramName]: id } };
      case JurisdictionLevel.SUBDIVISION:
        return { sql: `section.subdivision_id = :${paramName}`, params: { [paramName]: id } };
      case JurisdictionLevel.SECTION:
        return { sql: `complaint.section_id = :${paramName}`, params: { [paramName]: id } };
    }
  }
}
