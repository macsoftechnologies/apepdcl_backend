import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Section } from './entities/section.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

import { SectionPaginationDto } from './dto/section-pagination.dto';

@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
  ) {}

  async create(createDto: CreateSectionDto) {
    const section = this.sectionRepo.create(createDto);
    return await this.sectionRepo.save(section);
  }

  async findAll(paginationDto: SectionPaginationDto) {
    const { page = 1, limit = 10, search, subdivision_id } = paginationDto;
    const skip = (page - 1) * limit;

    let where: any = { is_active: true };
    if (search) {
      where = [
        { is_active: true, section_name: Like(`%${search}%`) },
        { is_active: true, section_code: Like(`%${search}%`) }
      ];
      if (subdivision_id) {
        where[0].subdivision_id = subdivision_id;
        where[1].subdivision_id = subdivision_id;
      }
    } else {
      if (subdivision_id) {
        where.subdivision_id = subdivision_id;
      }
    }

    const [items, total] = await this.sectionRepo.findAndCount({
      where,
      skip,
      take: limit,
      relations: { subdivision: true },
      order: { created_at: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      message: 'Sections fetched successfully',
    };
  }

  async findOne(id: number) {
    const section = await this.sectionRepo.findOne({
      where: { section_id: id },
      relations: { subdivision: true },
    });
    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }
    return section;
  }

  async update(id: number, updateData: Partial<CreateSectionDto>) {
    const section = await this.findOne(id);
    Object.assign(section, updateData);
    return await this.sectionRepo.save(section);
  }

  async remove(id: number) {
    const section = await this.findOne(id);
    section.is_active = false;
    return await this.sectionRepo.save(section);
  }
}
