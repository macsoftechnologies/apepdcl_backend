import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Designation } from './entities/designation.entity';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class DesignationService {
  constructor(
    @InjectRepository(Designation)
    private readonly designationRepo: Repository<Designation>,
  ) {}

  async create(createDto: CreateDesignationDto) {
    const designation = this.designationRepo.create(createDto);
    return await this.designationRepo.save(designation);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 50, search } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.title = Like(`%${search}%`);
    }

    const [items, total] = await this.designationRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { role_level: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      message: 'Designations fetched successfully',
    };
  }

  async findOne(id: number) {
    const designation = await this.designationRepo.findOne({
      where: { designation_id: id },
    });
    if (!designation) {
      throw new NotFoundException(`Designation with ID ${id} not found`);
    }
    return designation;
  }

  async update(id: number, updateData: Partial<CreateDesignationDto>) {
    const designation = await this.findOne(id);
    Object.assign(designation, updateData);
    return await this.designationRepo.save(designation);
  }

  async remove(id: number) {
    const designation = await this.findOne(id);
    return await this.designationRepo.remove(designation);
  }
}
