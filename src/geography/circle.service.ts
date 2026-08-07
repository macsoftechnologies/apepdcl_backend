import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Circle } from './entities/circle.entity';
import { CreateCircleDto } from './dto/create-circle.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class CircleService {
  constructor(
    @InjectRepository(Circle)
    private readonly circleRepo: Repository<Circle>,
  ) {}

  async create(createCircleDto: CreateCircleDto) {
    const circle = this.circleRepo.create(createCircleDto);
    return await this.circleRepo.save(circle);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    let where: any = { is_active: true };
    if (search) {
      where = [
        { circle_name: Like(`%${search}%`), is_active: true },
        { circle_code: Like(`%${search}%`), is_active: true }
      ];
    }

    const [items, total] = await this.circleRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      message: 'Circles fetched successfully',
    };
  }

  async findOne(id: number) {
    const circle = await this.circleRepo.findOne({ where: { circle_id: id } });
    if (!circle) {
      throw new NotFoundException(`Circle with ID ${id} not found`);
    }
    return circle;
  }

  async update(id: number, updateData: Partial<CreateCircleDto>) {
    const circle = await this.findOne(id);
    Object.assign(circle, updateData);
    return await this.circleRepo.save(circle);
  }

  async remove(id: number) {
    const circle = await this.findOne(id);
    circle.is_active = false;
    return await this.circleRepo.save(circle);
  }
}
