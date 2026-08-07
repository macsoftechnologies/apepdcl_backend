import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
