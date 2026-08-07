import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffJurisdiction } from './entities/staff-jurisdiction.entity';
import { AssignJurisdictionDto } from './dto/assign-jurisdiction.dto';
import { Circle } from '../geography/entities/circle.entity';
import { Division } from '../geography/entities/division.entity';
import { SubDivision } from '../geography/entities/subdivision.entity';
import { Section } from '../geography/entities/section.entity';

@Injectable()
export class JurisdictionService {
  constructor(
    @InjectRepository(StaffJurisdiction)
    private readonly jurisdictionRepo: Repository<StaffJurisdiction>,
    @InjectRepository(Circle) private circleRepo: Repository<Circle>,
    @InjectRepository(Division) private divisionRepo: Repository<Division>,
    @InjectRepository(SubDivision) private subDivisionRepo: Repository<SubDivision>,
    @InjectRepository(Section) private sectionRepo: Repository<Section>,
  ) {}

  async assignJurisdiction(assignDto: AssignJurisdictionDto) {
    const existing = await this.jurisdictionRepo.findOne({
      where: {
        staff_id: assignDto.staff_id,
        jurisdiction_level: assignDto.jurisdiction_level as any,
        jurisdiction_id: assignDto.jurisdiction_id
      }
    });

    if (existing) {
      throw new BadRequestException('This jurisdiction is already assigned to the staff member.');
    }

    const jurisdiction = this.jurisdictionRepo.create(assignDto);
    return await this.jurisdictionRepo.save(jurisdiction);
  }

  async getStaffJurisdictions(staffId: number) {
    const jurisdictions = await this.jurisdictionRepo.find({
      where: { staff_id: staffId },
    });

    for (const j of jurisdictions) {
      let name = 'Unknown';
      if (j.jurisdiction_level === 'Circle') {
        const c = await this.circleRepo.findOne({ where: { circle_id: j.jurisdiction_id }});
        if (c) name = c.circle_name;
      } else if (j.jurisdiction_level === 'Division') {
        const d = await this.divisionRepo.findOne({ where: { division_id: j.jurisdiction_id }});
        if (d) name = d.division_name;
      } else if (j.jurisdiction_level === 'SubDivision') {
        const s = await this.subDivisionRepo.findOne({ where: { subdivision_id: j.jurisdiction_id }});
        if (s) name = s.subdivision_name;
      } else if (j.jurisdiction_level === 'Section') {
        const s = await this.sectionRepo.findOne({ where: { section_id: j.jurisdiction_id }});
        if (s) name = s.section_name;
      }
      (j as any).name = name;
    }

    return jurisdictions;
  }

  async removeJurisdiction(allocationId: number) {
    const jurisdiction = await this.jurisdictionRepo.findOne({
      where: { allocation_id: allocationId },
    });
    if (!jurisdiction) {
      throw new NotFoundException(
        `Allocation with ID ${allocationId} not found`,
      );
    }
    return await this.jurisdictionRepo.remove(jurisdiction);
  }
}
