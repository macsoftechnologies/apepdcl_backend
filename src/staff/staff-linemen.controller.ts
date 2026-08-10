import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { LinemanDetails } from './entities/lineman-details.entity';
import { StaffJurisdiction, JurisdictionLevel } from './entities/staff-jurisdiction.entity';

@ApiTags('Staff - Linemen (AE/AEE Tools)')
@ApiBearerAuth()
@UseGuards(StaffAuthGuard, PermissionsGuard)
@Controller('staff/linemen/available')
export class StaffLinemenController {
  constructor(
    private readonly staffService: StaffService,
    @InjectRepository(LinemanDetails)
    private readonly linemanRepo: Repository<LinemanDetails>,
    @InjectRepository(StaffJurisdiction)
    private readonly jurisdictionRepo: Repository<StaffJurisdiction>,
  ) {}

  @Get()
  @RequirePermissions('ASSIGN_LINEMAN')
  async getAvailableLinemen(@Request() req: any) {
    const staffId = req.user.staff_id;
    const isSuperAdmin = req.user.is_super_admin;
    
    let linemen;

    if (isSuperAdmin) {
      const roster = await this.staffService.getLinemenRoster();
      return roster.items;
    } else {
      const jurisdictions = await this.jurisdictionRepo.find({
        where: { staff_id: staffId },
      });

      if (jurisdictions.length === 0) {
        return [];
      }

      const qb = this.linemanRepo
        .createQueryBuilder('lineman')
        .leftJoinAndSelect('lineman.staff', 'staff')
        .leftJoinAndSelect('lineman.section', 'section')
        .leftJoinAndSelect('section.subdivision', 'subdivision')
        .leftJoinAndSelect('subdivision.division', 'division')
        .leftJoinAndSelect('division.circle', 'circle');

      qb.andWhere(
        new Brackets((bracket) => {
          jurisdictions.forEach((j, index) => {
            let sql = '';
            let params = {};
            if (j.jurisdiction_level === 'Circle') {
              sql = 'circle.circle_id = :id' + index;
            } else if (j.jurisdiction_level === 'Division') {
              sql = 'division.division_id = :id' + index;
            } else if (j.jurisdiction_level === 'SubDivision') {
              sql = 'subdivision.subdivision_id = :id' + index;
            } else {
              sql = 'section.section_id = :id' + index;
            }
            params = { ['id' + index]: j.jurisdiction_id };

            if (index === 0) {
              bracket.where(sql, params);
            } else {
              bracket.orWhere(sql, params);
            }
          });
        }),
      );

      linemen = await qb.getMany();
    }

    return linemen.map(l => ({
      lineman_id: l.lineman_id,
      staff_id: l.staff_id,
      full_name: l.staff.full_name,
      phone_number: l.staff.phone_number,
      current_status: l.current_status,
      assigned_area: l.assigned_area,
    }));
  }
}
