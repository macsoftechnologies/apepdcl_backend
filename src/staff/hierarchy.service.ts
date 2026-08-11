import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StaffUser } from './entities/staff-user.entity';
import { StaffJurisdiction } from './entities/staff-jurisdiction.entity';
import { Circle } from '../geography/entities/circle.entity';
import { Division } from '../geography/entities/division.entity';
import { SubDivision } from '../geography/entities/subdivision.entity';
import { Section } from '../geography/entities/section.entity';
import { LinemanDetails } from './entities/lineman-details.entity';

@Injectable()
export class HierarchyService {
  constructor(
    @InjectRepository(StaffUser)
    private readonly staffRepo: Repository<StaffUser>,
    @InjectRepository(StaffJurisdiction)
    private readonly jurisdictionRepo: Repository<StaffJurisdiction>,
    @InjectRepository(Circle)
    private readonly circleRepo: Repository<Circle>,
    @InjectRepository(Division)
    private readonly divisionRepo: Repository<Division>,
    @InjectRepository(SubDivision)
    private readonly subDivisionRepo: Repository<SubDivision>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(LinemanDetails)
    private readonly linemanRepo: Repository<LinemanDetails>,
  ) {}

  async getHierarchyForStaff(staffId: number, isSuperAdmin: boolean) {
    let targetJurisdictions: StaffJurisdiction[] = [];

    if (isSuperAdmin) {
      // Super admin sees all circles
      const circles = await this.circleRepo.find({ where: { is_active: true } });
      targetJurisdictions = circles.map(c => ({
        jurisdiction_level: 'Circle',
        jurisdiction_id: c.circle_id,
      } as StaffJurisdiction));
    } else {
      targetJurisdictions = await this.jurisdictionRepo.find({
        where: { staff_id: staffId },
      });
    }

    if (!targetJurisdictions.length) return [];

    // Fetch all geographical entities (could be optimized, but ok for small datasets)
    const allCircles = await this.circleRepo.find();
    const allDivisions = await this.divisionRepo.find();
    const allSubDivisions = await this.subDivisionRepo.find();
    const allSections = await this.sectionRepo.find();

    // Fetch all staff mapped to these areas
    const allStaffJuris = await this.jurisdictionRepo.find();
    const allStaff = await this.staffRepo.find({ relations: ['designation'] });
    const allLinemen = await this.linemanRepo.find({ relations: ['staff'] });

    // Build the full tree in memory starting from the user's highest jurisdictions
    const result = [];

    for (const juris of targetJurisdictions) {
      if (juris.jurisdiction_level === 'Circle') {
        const circle = allCircles.find(c => c.circle_id === juris.jurisdiction_id);
        if (circle) result.push(this.buildCircleNode(circle, allDivisions, allSubDivisions, allSections, allStaff, allStaffJuris, allLinemen));
      } else if (juris.jurisdiction_level === 'Division') {
        const div = allDivisions.find(d => d.division_id === juris.jurisdiction_id);
        if (div) result.push(this.buildDivisionNode(div, allSubDivisions, allSections, allStaff, allStaffJuris, allLinemen));
      } else if (juris.jurisdiction_level === 'SubDivision') {
        const sub = allSubDivisions.find(s => s.subdivision_id === juris.jurisdiction_id);
        if (sub) result.push(this.buildSubDivisionNode(sub, allSections, allStaff, allStaffJuris, allLinemen));
      } else if (juris.jurisdiction_level === 'Section') {
        const sec = allSections.find(s => s.section_id === juris.jurisdiction_id);
        if (sec) result.push(this.buildSectionNode(sec, allStaff, allStaffJuris, allLinemen));
      }
    }

    return result;
  }

  private getStaffForJurisdiction(level: string, id: number, allStaff: StaffUser[], allStaffJuris: StaffJurisdiction[]) {
    const staffIds = allStaffJuris.filter(j => j.jurisdiction_level === level && j.jurisdiction_id === id).map(j => j.staff_id);
    return allStaff.filter(s => staffIds.includes(s.staff_id)).map(s => ({
      staff_id: s.staff_id,
      full_name: s.full_name,
      phone_number: s.phone_number,
      title: s.designation?.title,
    }));
  }

  private buildCircleNode(circle: Circle, allDivisions: Division[], allSubDivisions: SubDivision[], allSections: Section[], allStaff: StaffUser[], allStaffJuris: StaffJurisdiction[], allLinemen: LinemanDetails[]) {
    const divisions = allDivisions.filter(d => d.circle_id === circle.circle_id);
    return {
      type: 'Circle',
      id: circle.circle_id,
      name: circle.circle_name,
      code: circle.circle_code,
      staff: this.getStaffForJurisdiction('Circle', circle.circle_id, allStaff, allStaffJuris),
      children: divisions.map(d => this.buildDivisionNode(d, allSubDivisions, allSections, allStaff, allStaffJuris, allLinemen)),
    };
  }

  private buildDivisionNode(div: Division, allSubDivisions: SubDivision[], allSections: Section[], allStaff: StaffUser[], allStaffJuris: StaffJurisdiction[], allLinemen: LinemanDetails[]) {
    const subs = allSubDivisions.filter(s => s.division_id === div.division_id);
    return {
      type: 'Division',
      id: div.division_id,
      name: div.division_name,
      code: div.division_code,
      staff: this.getStaffForJurisdiction('Division', div.division_id, allStaff, allStaffJuris),
      children: subs.map(s => this.buildSubDivisionNode(s, allSections, allStaff, allStaffJuris, allLinemen)),
    };
  }

  private buildSubDivisionNode(sub: SubDivision, allSections: Section[], allStaff: StaffUser[], allStaffJuris: StaffJurisdiction[], allLinemen: LinemanDetails[]) {
    const secs = allSections.filter(s => s.subdivision_id === sub.subdivision_id);
    return {
      type: 'SubDivision',
      id: sub.subdivision_id,
      name: sub.subdivision_name,
      code: sub.subdivision_code,
      staff: this.getStaffForJurisdiction('SubDivision', sub.subdivision_id, allStaff, allStaffJuris),
      children: secs.map(s => this.buildSectionNode(s, allStaff, allStaffJuris, allLinemen)),
    };
  }

  private buildSectionNode(sec: Section, allStaff: StaffUser[], allStaffJuris: StaffJurisdiction[], allLinemen: LinemanDetails[]) {
    const linemen = allLinemen.filter(l => l.section_id === sec.section_id).map(l => ({
      staff_id: l.staff_id,
      full_name: l.staff?.full_name,
      phone_number: l.staff?.phone_number,
      title: 'Lineman',
      status: l.current_status,
    }));
    
    return {
      type: 'Section',
      id: sec.section_id,
      name: sec.section_name,
      code: sec.section_code,
      staff: this.getStaffForJurisdiction('Section', sec.section_id, allStaff, allStaffJuris),
      linemen: linemen,
      children: [], // Sections have no geographical children
    };
  }
}
