// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { StaffUser } from '../staff/entities/staff-user.entity';
import { AdminSendOtpDto, AdminVerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(StaffUser)
    private staffRepo: Repository<StaffUser>,
    private jwtService: JwtService,
  ) {}

  async sendOtp(dto: AdminSendOtpDto) {
    const user = await this.staffRepo.findOne({
      where: { phone_number: dto.mobile_number },
      relations: { designation: true },
    });

    if (!user) {
      throw new UnauthorizedException('No admin account found with this phone number');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    // In a real application, send OTP via SMS gateway here.
    // For now, we mock the OTP as '1234'
    return {
      success: true,
      message: 'OTP sent successfully to your phone number',
    };
  }

  async verifyOtp(dto: AdminVerifyOtpDto) {
    const user = await this.staffRepo.findOne({
      where: { phone_number: dto.mobile_number },
      relations: { designation: true },
    });

    if (!user) {
      throw new UnauthorizedException('No admin account found with this phone number');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Mock validation
    if (dto.otp !== '1234') {
      throw new UnauthorizedException('Invalid OTP');
    }

    const payload = {
      sub: user.staff_id,
      email: user.email,
      is_super_admin: user.is_super_admin,
      role_level: user.designation?.role_level,
      is_staff: true,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        staff_id: user.staff_id,
        full_name: user.full_name,
        phone_number: user.phone_number,
        email: user.email,
        designation: user.designation?.title,
        role_level: user.designation?.role_level,
        is_super_admin: user.is_super_admin,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.staffRepo.findOne({
      where: { staff_id: userId },
      relations: { designation: true, jurisdictions: true },
    });
    return user;
  }
}
