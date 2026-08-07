import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffUser } from './entities/staff-user.entity';
import { StaffPermission } from './entities/staff-permission.entity';
import { StaffSendOtpDto, StaffVerifyOtpDto } from './dto/staff-auth.dto';
import { LinemanDetails } from './entities/lineman-details.entity';

@Injectable()
export class StaffAuthService {
  constructor(
    @InjectRepository(StaffUser)
    private staffRepo: Repository<StaffUser>,
    @InjectRepository(StaffPermission)
    private staffPermRepo: Repository<StaffPermission>,
    @InjectRepository(LinemanDetails)
    private linemanRepo: Repository<LinemanDetails>,
    private jwtService: JwtService,
  ) {}

  async sendOtp(dto: StaffSendOtpDto) {
    const user = await this.staffRepo.findOne({
      where: { phone_number: dto.mobile_number },
    });

    if (!user) {
      throw new UnauthorizedException('No staff account found with this phone number');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Staff account is inactive');
    }

    // Mock sending OTP
    return {
      success: true,
      message: 'OTP sent successfully to staff phone number',
    };
  }

  async verifyOtp(dto: StaffVerifyOtpDto) {
    const user = await this.staffRepo.findOne({
      where: { phone_number: dto.mobile_number },
      relations: { designation: true, jurisdictions: true },
    });

    if (!user) {
      throw new UnauthorizedException('No staff account found with this phone number');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Staff account is inactive');
    }

    if (dto.otp !== '12345') {
      throw new UnauthorizedException('Invalid OTP');
    }

    const permissions = await this.staffPermRepo.find({
      where: { staff_id: user.staff_id },
      relations: { permission: true },
    });

    const permissionMap = permissions.reduce((acc, p) => {
      acc[p.permission.permission_key] = true;
      return acc;
    }, {} as Record<string, boolean>);

    const payload = {
      sub: user.staff_id,
      email: user.email,
      phone_number: user.phone_number,
      is_staff: true,
      role_level: user.designation?.role_level,
    };

    const linemanDetails = await this.linemanRepo.findOne({
      where: { staff_id: user.staff_id },
    });

    if (linemanDetails) {
      payload['lineman_id'] = linemanDetails.lineman_id;
      payload['section_id'] = linemanDetails.section_id;
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        staff_id: user.staff_id,
        full_name: user.full_name,
        phone_number: user.phone_number,
        email: user.email,
        designation: user.designation?.title,
        role_level: user.designation?.role_level,
        jurisdictions: user.jurisdictions,
        lineman_id: linemanDetails?.lineman_id,
        section_id: linemanDetails?.section_id,
      },
      permissions: permissionMap,
    };
  }
}
