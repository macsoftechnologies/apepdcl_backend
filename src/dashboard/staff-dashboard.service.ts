import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Complaint, ComplaintStatus } from '../complaints/entities/complaint.entity';
import { StaffJurisdiction, JurisdictionLevel } from '../staff/entities/staff-jurisdiction.entity';

@Injectable()
export class StaffDashboardService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepo: Repository<Complaint>,
    @InjectRepository(StaffJurisdiction)
    private readonly jurisdictionRepo: Repository<StaffJurisdiction>,
  ) {}

  async getDashboardStats(staffId: number, isSuperAdmin: boolean, roleLevel: number) {
    const query = this.complaintRepo
      .createQueryBuilder('complaint')
      .leftJoin('complaint.section', 'section')
      .leftJoin('section.subdivision', 'subdivision')
      .leftJoin('subdivision.division', 'division');

    if (!isSuperAdmin && roleLevel !== 1) { // 1 = Lineman
      const jurisdictions = await this.jurisdictionRepo.find({
        where: { staff_id: staffId },
      });

      if (jurisdictions.length === 0) {
        return { total_complaints: 0, pending_complaints: 0, assigned_complaints: 0, working_complaints: 0, resolved_complaints: 0 };
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
      // Lineman: query lineman_details to get lineman_id
      const lineman = await query.manager.query(
        'SELECT lineman_id FROM linemen_details WHERE staff_id = ?',
        [staffId]
      );
      if (lineman.length === 0) {
         return { total_complaints: 0, pending_complaints: 0, assigned_complaints: 0, working_complaints: 0, resolved_complaints: 0 };
      }
      query.andWhere('complaint.assigned_lineman_id = :linemanId', { linemanId: lineman[0].lineman_id });
    }

    const complaints = await query.getMany();
    console.log('Dashboard complaints fetched:', complaints.length);

    let total = 0;
    let pending = 0;
    let assigned = 0;
    let working = 0;
    let resolved = 0;

    complaints.forEach((c) => {
      total++;
      if (c.status === ComplaintStatus.RAISED) pending++;
      else if (c.status === ComplaintStatus.ASSIGNED) assigned++;
      else if (c.status === ComplaintStatus.WORKING) working++;
      else if (c.status === ComplaintStatus.RESOLVED) resolved++;
    });

    return {
      total_complaints: total,
      pending_complaints: pending,
      assigned_complaints: assigned,
      working_complaints: working,
      resolved_complaints: resolved,
    };
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
