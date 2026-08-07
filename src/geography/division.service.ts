import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Division } from './entities/division.entity';
import { CreateDivisionDto } from './dto/create-division.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

import { DivisionPaginationDto } from './dto/division-pagination.dto';

@Injectable()
export class DivisionService {
  constructor(
    @InjectRepository(Division)
    private readonly divisionRepo: Repository<Division>,
  ) {}

  async create(createDto: CreateDivisionDto) {
    const division = this.divisionRepo.create(createDto);
    return await this.divisionRepo.save(division);
  }

  async findAll(paginationDto: DivisionPaginationDto) {
    const { page = 1, limit = 10, search, circle_id } = paginationDto;
    const skip = (page - 1) * limit;

    let where: any = { is_active: true };
    if (search) {
      where = [
        { is_active: true, division_name: Like(`%${search}%`) },
        { is_active: true, division_code: Like(`%${search}%`) }
      ];
      if (circle_id) {
        where[0].circle_id = circle_id;
        where[1].circle_id = circle_id;
      }
    } else {
      if (circle_id) {
        where.circle_id = circle_id;
      }
    }

    const [items, total] = await this.divisionRepo.findAndCount({
      where,
      skip,
      take: limit,
      relations: { circle: true },
      order: { created_at: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      message: 'Divisions fetched successfully',
    };
  }

  async findOne(id: number) {
    const division = await this.divisionRepo.findOne({
      where: { division_id: id },
      relations: { circle: true },
    });
    if (!division) {
      throw new NotFoundException(`Division with ID ${id} not found`);
    }
    return division;
  }

  async update(id: number, updateData: Partial<CreateDivisionDto>) {
    const division = await this.findOne(id);
    Object.assign(division, updateData);
    return await this.divisionRepo.save(division);
  }

  async remove(id: number) {
    const division = await this.findOne(id);
    division.is_active = false;
    return await this.divisionRepo.save(division);
  }
}
