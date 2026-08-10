import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Consumer } from '../complaints/entities/consumer.entity';
import { Section } from '../geography/entities/section.entity';
import { StaffUser } from '../staff/entities/staff-user.entity';
import { StaffPermission } from '../staff/entities/staff-permission.entity';
import { Permission } from '../staff/entities/permission.entity';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterConsumerDto } from './dto/register-consumer.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Consumer)
    private readonly consumerRepo: Repository<Consumer>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(StaffUser)
    private readonly staffRepo: Repository<StaffUser>,
    @InjectRepository(StaffPermission)
    private readonly staffPermRepo: Repository<StaffPermission>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    // Mock OTP logic
    console.log(`Mock sending OTP 1234 to ${dto.mobile_number}`);
    return { success: true, message: 'OTP sent successfully (Mock: 1234)' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    if (dto.otp !== '1234') {
      throw new UnauthorizedException('Invalid OTP');
    }

    // 1. Check if this is a Consumer
    const consumer = await this.consumerRepo.findOne({ where: { mobile_number: dto.mobile_number } });
    if (consumer) {
      const token = this.jwtService.sign({ sub: consumer.consumer_id, is_consumer: true });
      return { 
        success: true, 
        message: 'Consumer login successful', 
        data: { is_registered: true, is_staff: false, token, consumer } 
      };
    }

    // 2. Check if this is a Staff member
    const staff = await this.staffRepo.findOne({ where: { phone_number: dto.mobile_number, is_active: true } });
    if (staff) {
      const allPerms = await this.permissionRepo.find();
      const perms = await this.staffPermRepo.find({ where: { staff_id: staff.staff_id } });
      const assignedKeys = new Set(perms.map(p => p.permission_key));
      
      const permissionsMap: Record<string, boolean> = {};
      for (const p of allPerms) {
        permissionsMap[p.permission_key] = assignedKeys.has(p.permission_key);
      }
      
      // Keep array for JWT payload
      const permissions = perms.map(p => p.permission_key);
      const token = this.jwtService.sign({ sub: staff.staff_id, is_staff: true, permissions });
      return {
        success: true,
        message: 'Staff login successful',
        data: { is_registered: true, is_staff: true, token, user: staff, permissions: permissionsMap }
      };
    }

    // 3. Fall back to not registered
    return { 
      success: true, 
      message: 'OTP verified. Consumer not registered.', 
      data: { is_registered: false, is_staff: false } 
    };
  }

  async getProfile(consumerId: number) {
    const consumer = await this.consumerRepo.findOne({ 
      where: { consumer_id: consumerId },
      relations: { section: true }
    });
    if (!consumer) {
      throw new UnauthorizedException('Consumer not found');
    }
    return {
      success: true,
      message: 'Profile fetched successfully',
      data: consumer
    };
  }

  async register(dto: RegisterConsumerDto) {
    const existing = await this.consumerRepo.findOne({ 
      where: [
        { mobile_number: dto.mobile_number },
        { service_connection_number: dto.service_connection_number }
      ]
    });
    
    if (existing) {
      throw new BadRequestException('Consumer with this mobile number or service connection number already exists.');
    }

    const sections = await this.sectionRepo.find();
    let section_id: number | undefined = undefined;
    
    for (const section of sections) {
      if (section.service_number_from && section.service_number_to) {
        if (
          dto.service_connection_number >= section.service_number_from && 
          dto.service_connection_number <= section.service_number_to
        ) {
          section_id = section.section_id;
          break;
        }
      }
    }

    const consumer = new Consumer();
    consumer.mobile_number = dto.mobile_number;
    consumer.full_name = dto.full_name;
    consumer.service_connection_number = dto.service_connection_number;
    consumer.address = dto.address;
    consumer.gps_lat = dto.gps_lat;
    consumer.gps_lng = dto.gps_lng;
    if (section_id === undefined) {
      throw new BadRequestException('Invalid Service Connection Number. This number is not registered in our valid geographical sections. Please contact support.');
    }
    
    consumer.section_id = section_id;
    const saved = await this.consumerRepo.save(consumer);
    const token = this.jwtService.sign({ sub: saved.consumer_id, is_consumer: true });

    return {
      success: true,
      message: 'Registration successful',
      data: { token, consumer: saved }
    };
  }
}
