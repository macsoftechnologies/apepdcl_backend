import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { StaffUser } from './entities/staff-user.entity';
import { CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Circle } from '../geography/entities/circle.entity';
import { Division } from '../geography/entities/division.entity';
import { SubDivision } from '../geography/entities/subdivision.entity';
import { Section } from '../geography/entities/section.entity';
import { StaffPermission } from './entities/staff-permission.entity';
import { Permission } from './entities/permission.entity';
import { Designation } from './entities/designation.entity';
import { LinemanDetails } from './entities/lineman-details.entity';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsInt, IsBoolean } from 'class-validator';

export class StaffPaginationDto extends PaginationDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  designation_id?: number;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffUser)
    private readonly staffRepo: Repository<StaffUser>,
    @InjectRepository(StaffPermission)
    private readonly staffPermRepo: Repository<StaffPermission>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(Designation)
    private readonly designationRepo: Repository<Designation>,
    @InjectRepository(LinemanDetails)
    private readonly linemanRepo: Repository<LinemanDetails>,
    @InjectRepository(Circle) private circleRepo: Repository<Circle>,
    @InjectRepository(Division) private divisionRepo: Repository<Division>,
    @InjectRepository(SubDivision) private subDivisionRepo: Repository<SubDivision>,
    @InjectRepository(Section) private sectionRepo: Repository<Section>,
  ) {}

  private async populateJurisdictionNames(staff: StaffUser) {
    if (!staff.jurisdictions) return staff;
    for (const j of staff.jurisdictions) {
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
    return staff;
  }

  async create(createDto: CreateStaffDto) {
    const existing = await this.staffRepo.findOne({
      where: { email: createDto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(createDto.password, salt);

    const staff = this.staffRepo.create({
      ...createDto,
      password_hash,
    });

    const savedStaff = await this.staffRepo.save(staff);

    await this.handleLinemanDetails(savedStaff.staff_id, savedStaff.designation_id);

    return savedStaff;
  }

  private async handleLinemanDetails(staffId: number, designationId: number) {
    const designation = await this.designationRepo.findOne({ where: { designation_id: designationId } });
    if (!designation) return;

    if (designation.title.toLowerCase() === 'lineman') {
      const exists = await this.linemanRepo.findOne({ where: { staff_id: staffId } });
      if (!exists) {
        const newLineman = this.linemanRepo.create({ staff_id: staffId });
        await this.linemanRepo.save(newLineman);
      }
    } else {
      await this.linemanRepo.delete({ staff_id: staffId });
    }
  }

  async getLinemenRoster(query: any = {}) {
    console.log('--- getLinemenRoster() CALLED ---');
    const { page = 1, limit = 10, search, circle_id } = query;
    const offset = (page - 1) * limit;

    try {
      let queryStr = `
        SELECT 
          s.staff_id as lineman_id, 
          s.full_name, 
          s.phone_number,
          CASE WHEN s.is_active = 1 THEN 'Available' ELSE 'Offline' END as current_status,
          COALESCE(
            CASE WHEN sj.jurisdiction_level = 'Section' THEN sec.section_name ELSE NULL END, 
            sj.jurisdiction_level
          ) as assigned_area
        FROM staff_users s
        JOIN designations d ON s.designation_id = d.designation_id
        LEFT JOIN staff_jurisdictions sj ON sj.staff_id = s.staff_id
        LEFT JOIN sections sec ON sj.jurisdiction_level = 'Section' AND sec.section_id = sj.jurisdiction_id
        LEFT JOIN subdivisions sub ON sec.subdivision_id = sub.subdivision_id
        LEFT JOIN divisions divs ON sub.division_id = divs.division_id
        WHERE d.title LIKE '%Lineman%'
      `;
      let countQueryStr = `
        SELECT COUNT(DISTINCT s.staff_id) as total
        FROM staff_users s
        JOIN designations d ON s.designation_id = d.designation_id
        LEFT JOIN staff_jurisdictions sj ON sj.staff_id = s.staff_id
        LEFT JOIN sections sec ON sj.jurisdiction_level = 'Section' AND sec.section_id = sj.jurisdiction_id
        LEFT JOIN subdivisions sub ON sec.subdivision_id = sub.subdivision_id
        LEFT JOIN divisions divs ON sub.division_id = divs.division_id
        WHERE d.title LIKE '%Lineman%'
      `;
      
      let params: any[] = [];
      let countParams: any[] = [];
      
      if (search) {
        const searchClause = ` AND (s.full_name LIKE ? OR s.phone_number LIKE ?)`;
        queryStr += searchClause;
        countQueryStr += searchClause;
        params.push(`%${search}%`, `%${search}%`);
        countParams.push(`%${search}%`, `%${search}%`);
      }

      if (circle_id) {
        const circleClause = ` AND (divs.circle_id = ? OR (sj.jurisdiction_level = 'Circle' AND sj.jurisdiction_id = ?))`;
        queryStr += circleClause;
        countQueryStr += circleClause;
        params.push(circle_id, circle_id);
        countParams.push(circle_id, circle_id);
      }

      queryStr += ` ORDER BY s.is_active DESC, s.full_name ASC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

      console.log('EXECUTING QUERY:', queryStr, params);
      const linemen = await this.staffRepo.query(queryStr, params);
      
      console.log('EXECUTING COUNT:', countQueryStr, countParams);
      const totalResult = await this.staffRepo.query(countQueryStr, countParams);
      const total = totalResult.length > 0 ? Number(totalResult[0].total) : 0;
      
      return { 
        items: linemen, 
        total, 
        page: Number(page), 
        limit: Number(limit) 
      };
    } catch (e) {
      console.error('ERROR IN QUERY:', e);
      require('fs').writeFileSync('c:\\\\Shanmukha\\\\apepdcl\\\\backend\\\\debug_error.log', String(e.stack || e));
      return { items: [], total: 0 };
    }
  }

  async findAll(paginationDto: StaffPaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      designation_id,
      is_active,
    } = paginationDto;
    const skip = (page - 1) * limit;

    let where: any = {};
    
    // Default to only active unless explicitly asked
    if (is_active !== undefined) {
      where.is_active = is_active;
    } else {
      where.is_active = true;
    }

    if (designation_id !== undefined) {
      where.designation_id = designation_id;
    }

    if (search) {
      where = [
        { ...where, full_name: Like(`%${search}%`) },
        { ...where, email: Like(`%${search}%`) },
        { ...where, phone_number: Like(`%${search}%`) }
      ];
    }

    const [items, total] = await this.staffRepo.findAndCount({
      where,
      skip,
      take: limit,
      relations: { designation: true, jurisdictions: true, permissions: true },
      order: { created_at: 'DESC' },
    });

    for (const item of items) {
      await this.populateJurisdictionNames(item);
    }

    return { items, total, page, limit, message: 'Staff fetched successfully' };
  }

  async findOne(id: number) {
    const staff = await this.staffRepo.findOne({
      where: { staff_id: id },
      relations: { designation: true, jurisdictions: true },
    });
    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }
    return await this.populateJurisdictionNames(staff);
  }

  async update(id: number, updateDto: UpdateStaffDto) {
    const staff = await this.findOne(id);

    if (updateDto.email && updateDto.email !== staff.email) {
      const existing = await this.staffRepo.findOne({
        where: { email: updateDto.email },
      });
      if (existing) {
        throw new BadRequestException('Email already in use');
      }
    }

    let password_hash = staff.password_hash;
    if (updateDto.password) {
      const salt = await bcrypt.genSalt(10);
      password_hash = await bcrypt.hash(updateDto.password, salt);
    }

    Object.assign(staff, {
      ...updateDto,
      password_hash,
    });

    const savedStaff = await this.staffRepo.save(staff);

    if (updateDto.designation_id) {
      await this.handleLinemanDetails(savedStaff.staff_id, updateDto.designation_id);
    }

    return savedStaff;
  }

  async toggleActive(id: number) {
    const staff = await this.findOne(id);
    staff.is_active = !staff.is_active;
    return await this.staffRepo.save(staff);
  }

  async remove(id: number) {
    const staff = await this.findOne(id);
    staff.is_active = false;
    return await this.staffRepo.save(staff);
  }

  async resetPassword(id: number, newPassword: string) {
    const staff = await this.findOne(id);
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    staff.password_hash = password_hash;
    await this.staffRepo.save(staff);
    return { success: true, message: 'Password reset successfully' };
  }

  async getPermissions(staffId: number) {
    const allPerms = await this.permissionRepo.find();
    const perms = await this.staffPermRepo.find({ where: { staff_id: staffId } });
    const assignedKeys = new Set(perms.map(p => p.permission_key));
    
    const map: Record<string, boolean> = {};
    for (const p of allPerms) {
      map[p.permission_key] = assignedKeys.has(p.permission_key);
    }
    
    return {
      success: true,
      data: map
    };
  }

  async updatePermissions(staffId: number, permissions: string[]) {
    // Delete existing
    await this.staffPermRepo.delete({ staff_id: staffId });
    // Insert new
    if (permissions && permissions.length > 0) {
      const inserts = permissions.map(p => this.staffPermRepo.create({
        staff_id: staffId,
        permission_key: p
      }));
      await this.staffPermRepo.save(inserts);
    }
    return { success: true, message: 'Permissions updated successfully' };
  }
}
