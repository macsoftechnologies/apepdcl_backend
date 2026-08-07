import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffJurisdiction } from './entities/staff-jurisdiction.entity';
import { AssignJurisdictionDto } from './dto/assign-jurisdiction.dto';

@Injectable()
export class JurisdictionService {
  constructor(
    @InjectRepository(StaffJurisdiction)
    private readonly jurisdictionRepo: Repository<StaffJurisdiction>,
  ) {}

  async assignJurisdiction(assignDto: AssignJurisdictionDto) {
    const jurisdiction = this.jurisdictionRepo.create(assignDto);
    return await this.jurisdictionRepo.save(jurisdiction);
  }

  async getStaffJurisdictions(staffId: number) {
    return await this.jurisdictionRepo.find({
      where: { staff_id: staffId },
    });
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
