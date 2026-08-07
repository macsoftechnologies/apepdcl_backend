import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Circle } from './entities/circle.entity';
import { Division } from './entities/division.entity';
import { SubDivision } from './entities/subdivision.entity';
import { Section } from './entities/section.entity';

@Injectable()
export class DropdownsService {
  constructor(
    @InjectRepository(Circle) private circleRepo: Repository<Circle>,
    @InjectRepository(Division) private divisionRepo: Repository<Division>,
    @InjectRepository(SubDivision) private subDivisionRepo: Repository<SubDivision>,
    @InjectRepository(Section) private sectionRepo: Repository<Section>,
    private dataSource: DataSource,
  ) {}

  async getDropdowns(query: any) {
    if (query.subdivision_id) {
      const data = await this.sectionRepo.find({
        where: { subdivision_id: Number(query.subdivision_id), is_active: true },
        select: { section_id: true, section_name: true },
        order: { section_name: 'ASC' }
      });
      return { success: true, data: data.map(d => ({ id: d.section_id, name: d.section_name, type: 'section' })) };
    }

    if (query.division_id) {
      const data = await this.subDivisionRepo.find({
        where: { division_id: Number(query.division_id), is_active: true },
        select: { subdivision_id: true, subdivision_name: true },
        order: { subdivision_name: 'ASC' }
      });
      return { success: true, data: data.map(d => ({ id: d.subdivision_id, name: d.subdivision_name, type: 'subdivision' })) };
    }

    if (query.circle_id) {
      const data = await this.divisionRepo.find({
        where: { circle_id: Number(query.circle_id), is_active: true },
        select: { division_id: true, division_name: true },
        order: { division_name: 'ASC' }
      });
      return { success: true, data: data.map(d => ({ id: d.division_id, name: d.division_name, type: 'division' })) };
    }

    // Default return all circles
    const data = await this.circleRepo.find({
      where: { is_active: true },
      select: { circle_id: true, circle_name: true },
      order: { circle_name: 'ASC' }
    });
    return { success: true, data: data.map(d => ({ id: d.circle_id, name: d.circle_name, type: 'circle' })) };
  }

  async getGeographyTree(level: string, id: number) {
    let tree: any = {};

    if (level === 'Circle') {
      const circle = await this.circleRepo.findOne({ where: { circle_id: id } });
      if (!circle) return { success: false, message: 'Circle not found' };
      tree = { id: circle.circle_id, name: circle.circle_name, type: 'Circle', children: [] };

      const divisions = await this.divisionRepo.find({ where: { circle_id: id, is_active: true } });
      for (const d of divisions) {
        const divNode: any = { id: d.division_id, name: d.division_name, type: 'Division', children: [] };
        const subdivisions = await this.subDivisionRepo.find({ where: { division_id: d.division_id, is_active: true } });
        for (const s of subdivisions) {
          const subNode: any = { id: s.subdivision_id, name: s.subdivision_name, type: 'SubDivision', children: [] };
          const sections = await this.sectionRepo.find({ where: { subdivision_id: s.subdivision_id, is_active: true } });
          subNode.children = sections.map(sec => ({ id: sec.section_id, name: sec.section_name, type: 'Section' }));
          divNode.children.push(subNode);
        }
        tree.children.push(divNode);
      }
    } else if (level === 'Division') {
      const division = await this.divisionRepo.findOne({ where: { division_id: id } });
      if (!division) return { success: false, message: 'Division not found' };
      tree = { id: division.division_id, name: division.division_name, type: 'Division', children: [] };

      const subdivisions = await this.subDivisionRepo.find({ where: { division_id: id, is_active: true } });
      for (const s of subdivisions) {
        const subNode: any = { id: s.subdivision_id, name: s.subdivision_name, type: 'SubDivision', children: [] };
        const sections = await this.sectionRepo.find({ where: { subdivision_id: s.subdivision_id, is_active: true } });
        subNode.children = sections.map(sec => ({ id: sec.section_id, name: sec.section_name, type: 'Section' }));
        tree.children.push(subNode);
      }
    } else if (level === 'SubDivision') {
      const sub = await this.subDivisionRepo.findOne({ where: { subdivision_id: id } });
      if (!sub) return { success: false, message: 'SubDivision not found' };
      tree = { id: sub.subdivision_id, name: sub.subdivision_name, type: 'SubDivision', children: [] };

      const sections = await this.sectionRepo.find({ where: { subdivision_id: id, is_active: true } });
      tree.children = sections.map(sec => ({ id: sec.section_id, name: sec.section_name, type: 'Section' }));
    } else if (level === 'Section') {
      const sec = await this.sectionRepo.findOne({ where: { section_id: id } });
      if (!sec) return { success: false, message: 'Section not found' };
      tree = { id: sec.section_id, name: sec.section_name, type: 'Section' };
    } else {
      return { success: false, message: 'Invalid level' };
    }

    // After building the tree, traverse and fetch metrics
    await this.populateMetrics(tree);

    return { success: true, data: tree };
  }

  private async populateMetrics(node: any) {
    let staffCount = 0;
    try {
      const staffQuery = `SELECT COUNT(*) as cnt FROM staff_jurisdictions WHERE jurisdiction_level = ? AND jurisdiction_id = ?`;
      const [staffResult] = await this.dataSource.query(staffQuery, [node.type, node.id]);
      staffCount = parseInt(staffResult?.cnt || 0);
    } catch (e) {}

    let complaintCount = 0;

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        await this.populateMetrics(child);
        complaintCount += child.metrics.complaint_count;
      }
    }

    if (node.type === 'Section') {
      try {
        const complaintQuery = `SELECT COUNT(*) as cnt FROM complaints WHERE section_id = ? AND status != 'Resolved'`;
        const [compResult] = await this.dataSource.query(complaintQuery, [node.id]);
        complaintCount += parseInt(compResult?.cnt || 0);
      } catch (e) {}
    }

    node.metrics = {
      staff_count: staffCount,
      complaint_count: complaintCount
    };
  }

  async getNodeDetails(level: string, id: number) {
    const staffQuery = `
      SELECT 
        u.staff_id, u.full_name, u.email, u.phone_number, u.is_active,
        d.title as designation_title,
        j.jurisdiction_level, j.jurisdiction_id
      FROM staff_jurisdictions j
      JOIN staff_users u ON j.staff_id = u.staff_id
      LEFT JOIN designations d ON u.designation_id = d.designation_id
      WHERE j.jurisdiction_level = ? AND j.jurisdiction_id = ?
      ORDER BY d.role_level DESC
    `;

    try {
      const staffList = await this.dataSource.query(staffQuery, [level, id]);
      return { success: true, data: { staff: staffList } };
    } catch (e) {
      return { success: false, message: 'Failed to fetch node details' };
    }
  }
}
