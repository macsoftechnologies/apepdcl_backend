import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SubDivision } from './entities/subdivision.entity';
import { CreateSubdivisionDto } from './dto/create-subdivision.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

import { SubdivisionPaginationDto } from './dto/subdivision-pagination.dto';

@Injectable()
export class SubdivisionService {
  constructor(
    @InjectRepository(SubDivision)
    private readonly subdivRepo: Repository<SubDivision>,
  ) {}

  async create(createDto: CreateSubdivisionDto) {
    const subdiv = this.subdivRepo.create(createDto);
    return await this.subdivRepo.save(subdiv);
  }

  async findAll(paginationDto: SubdivisionPaginationDto) {
    const { page = 1, limit = 10, search, division_id } = paginationDto;
    const skip = (page - 1) * limit;

    let where: any = { is_active: true };
    if (search) {
      where = [
        { is_active: true, subdivision_name: Like(`%${search}%`) },
        { is_active: true, subdivision_code: Like(`%${search}%`) }
      ];
      if (division_id) {
        where[0].division_id = division_id;
        where[1].division_id = division_id;
      }
    } else {
      if (division_id) {
        where.division_id = division_id;
      }
    }

    const [items, total] = await this.subdivRepo.findAndCount({
      where,
      skip,
      take: limit,
      relations: { division: true },
      order: { created_at: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      message: 'Subdivisions fetched successfully',
    };
  }

  async findOne(id: number) {
    const subdiv = await this.subdivRepo.findOne({
      where: { subdivision_id: id },
      relations: { division: true },
    });
    if (!subdiv) {
      throw new NotFoundException(`Subdivision with ID ${id} not found`);
    }
    return subdiv;
  }

  async update(id: number, updateData: Partial<CreateSubdivisionDto>) {
    const subdiv = await this.findOne(id);
    Object.assign(subdiv, updateData);
    return await this.subdivRepo.save(subdiv);
  }

  async remove(id: number) {
    const subdiv = await this.findOne(id);
    subdiv.is_active = false;
    return await this.subdivRepo.save(subdiv);
  }
}
