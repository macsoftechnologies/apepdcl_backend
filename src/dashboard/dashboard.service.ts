import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Complaint, ComplaintStatus } from '../complaints/entities/complaint.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepo: Repository<Complaint>,
  ) {}

  private applyFilters(qb: SelectQueryBuilder<Complaint>, filters: any) {
    if (filters.circle_id || filters.division_id || filters.subdivision_id || filters.section_id) {
      // prevent duplicate joins if already joined
      if (!qb.expressionMap.joinAttributes.some(j => j.alias.name === 'section')) {
        qb.leftJoin('complaint.section', 'section');
      }
      if (!qb.expressionMap.joinAttributes.some(j => j.alias.name === 'subdivision')) {
        qb.leftJoin('section.subdivision', 'subdivision');
      }
      if (!qb.expressionMap.joinAttributes.some(j => j.alias.name === 'division')) {
        qb.leftJoin('subdivision.division', 'division');
      }
      if (!qb.expressionMap.joinAttributes.some(j => j.alias.name === 'circle')) {
        qb.leftJoin('division.circle', 'circle');
      }

      if (filters.section_id) {
        qb.andWhere('complaint.section_id = :section_id', { section_id: filters.section_id });
      } else if (filters.subdivision_id) {
        qb.andWhere('section.subdivision_id = :subdivision_id', { subdivision_id: filters.subdivision_id });
      } else if (filters.division_id) {
        qb.andWhere('subdivision.division_id = :division_id', { division_id: filters.division_id });
      } else if (filters.circle_id) {
        qb.andWhere('division.circle_id = :circle_id', { circle_id: filters.circle_id });
      }
    }

    if (filters.from_date && filters.to_date) {
      qb.andWhere('complaint.created_at BETWEEN :start AND :end', { start: new Date(filters.from_date), end: new Date(filters.to_date) });
    } else if (filters.from_date) {
      qb.andWhere('complaint.created_at >= :start', { start: new Date(filters.from_date) });
    } else if (filters.to_date) {
      qb.andWhere('complaint.created_at <= :end', { end: new Date(filters.to_date) });
    }
    
    return qb;
  }

  async getStats(filters: any) {
    let qb = this.complaintRepo.createQueryBuilder('complaint');
    qb = this.applyFilters(qb, filters);

    // Base totals
    const totalComplaints = await qb.getCount();
    
    // Status breakdowns
    const open = await qb.clone().andWhere('complaint.status IN (:...statuses)', { 
      statuses: [ComplaintStatus.RAISED, ComplaintStatus.ASSIGNED, ComplaintStatus.WORKING] 
    }).getCount();

    const resolved = await qb.clone().andWhere('complaint.status = :status', { 
      status: ComplaintStatus.RESOLVED 
    }).getCount();

    // Pending > 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingOver24h = await qb.clone()
      .andWhere('complaint.status != :status', { status: ComplaintStatus.RESOLVED })
      .andWhere('complaint.created_at < :date', { date: oneDayAgo })
      .getCount();

    // By category
    const byCategoryRaw = await qb.clone()
      .select('complaint.category_key', 'category')
      .addSelect('COUNT(complaint.complaint_id)', 'count')
      .groupBy('complaint.category_key')
      .getRawMany();

    const byCategory = byCategoryRaw.map(r => ({
      category: r.category,
      count: parseInt(r.count, 10),
    }));

    // By status (Pie chart)
    const byStatusRaw = await qb.clone()
      .select('complaint.status', 'status')
      .addSelect('COUNT(complaint.complaint_id)', 'count')
      .groupBy('complaint.status')
      .getRawMany();

    const byStatus = byStatusRaw.map(r => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));

    // By circle (Bar chart)
    const qbCircle = qb.clone();
    if (!qbCircle.expressionMap.joinAttributes.some(j => j.alias.name === 'section')) qbCircle.leftJoin('complaint.section', 'section');
    if (!qbCircle.expressionMap.joinAttributes.some(j => j.alias.name === 'subdivision')) qbCircle.leftJoin('section.subdivision', 'subdivision');
    if (!qbCircle.expressionMap.joinAttributes.some(j => j.alias.name === 'division')) qbCircle.leftJoin('subdivision.division', 'division');
    if (!qbCircle.expressionMap.joinAttributes.some(j => j.alias.name === 'circle')) qbCircle.leftJoin('division.circle', 'circle');

    const byCircleRaw = await qbCircle
      .select('circle.circle_name', 'circle')
      .addSelect('COUNT(complaint.complaint_id)', 'count')
      .groupBy('circle.circle_id')
      .addGroupBy('circle.circle_name')
      .getRawMany();

    const byCircle = byCircleRaw.map(r => ({
      circle: r.circle || 'Unknown',
      count: parseInt(r.count, 10),
    }));

    // Top 5 Areas (Sections) with most complaints
    const topSectionsRaw = await qbCircle.clone()
      .select('section.section_name', 'section')
      .addSelect('COUNT(complaint.complaint_id)', 'count')
      .groupBy('section.section_id')
      .addGroupBy('section.section_name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();
    
    const top5Sections = topSectionsRaw.map(r => ({
      section: r.section || 'Unknown',
      count: parseInt(r.count, 10),
    }));

    // 5 Oldest unresolved complaints
    const oldest5Unresolved = await qb.clone()
      .leftJoinAndSelect('complaint.consumer', 'consumer')
      .andWhere('complaint.status != :status', { status: ComplaintStatus.RESOLVED })
      .orderBy('complaint.created_at', 'ASC')
      .take(5)
      .getMany();

    // Recent 10 complaints
    const recent10 = await qb.clone()
      .leftJoinAndSelect('complaint.consumer', 'consumer')
      .orderBy('complaint.created_at', 'DESC')
      .take(10)
      .getMany();

    // Average resolution time (in hours)
    const resolvedItems = await qb.clone()
      .select(['complaint.created_at', 'complaint.resolved_at'])
      .andWhere('complaint.status = :status', { status: ComplaintStatus.RESOLVED })
      .getMany();

    let avgResolutionHours = 0;
    if (resolvedItems.length > 0) {
      const totalMs = resolvedItems.reduce((acc, c) => {
        return acc + (c.resolved_at.getTime() - c.created_at.getTime());
      }, 0);
      avgResolutionHours = (totalMs / resolvedItems.length) / (1000 * 60 * 60);
    }

    // Lineman Roster
    const linemenRaw = await this.complaintRepo.query(`
      SELECT s.staff_id, s.full_name, s.phone_number, s.is_active, d.title as designation,
             (SELECT COUNT(*) FROM complaints c WHERE c.assigned_lineman_id = s.staff_id AND c.status IN ('Assigned', 'Working')) as active_tasks
      FROM staff_users s
      JOIN designations d ON s.designation_id = d.designation_id
      WHERE d.title LIKE '%Lineman%'
      ORDER BY s.is_active DESC, s.full_name ASC
    `);

    return {
      success: true,
      data: {
        total: totalComplaints,
        open,
        resolved,
        pendingOver24h,
        avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
        byCategory,
        byStatus,
        byCircle,
        top5Sections,
        oldest5Unresolved,
        recent10,
        linemen: linemenRaw,
      }
    };
  }

  async getCharts(filters: any) {
    let qb = this.complaintRepo.createQueryBuilder('complaint');
    qb = this.applyFilters(qb, filters);

    // Get last 7 days grouped by date
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recent = await qb.select(['complaint.created_at'])
      .andWhere('complaint.created_at >= :date', { date: sevenDaysAgo })
      .getMany();

    const dailyData: Record<string, number> = {};
    recent.forEach(c => {
      const dateStr = c.created_at.toISOString().split('T')[0];
      dailyData[dateStr] = (dailyData[dateStr] || 0) + 1;
    });

    const chartData = Object.keys(dailyData).sort().map(date => ({
      date,
      count: dailyData[date]
    }));

    return {
      success: true,
      data: {
        dailyVolume: chartData,
      }
    };
  }

  async getHeatmap(filters: any) {
    let qb = this.complaintRepo.createQueryBuilder('complaint');
    qb = this.applyFilters(qb, filters);
    
    if (!qb.expressionMap.joinAttributes.some(j => j.alias.name === 'section')) qb.leftJoin('complaint.section', 'section');

    const raw = await qb
      .select('section.section_name', 'section')
      .addSelect('COUNT(complaint.complaint_id)', 'count')
      .groupBy('section.section_id')
      .addGroupBy('section.section_name')
      .getRawMany();

    const heatmap = raw.map(r => ({
      section: r.section || 'Unknown',
      count: parseInt(r.count, 10),
    }));

    return { 
      success: true,
      data: { heatmap } 
    };
  }
}
