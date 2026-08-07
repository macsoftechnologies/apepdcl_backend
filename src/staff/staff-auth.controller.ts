import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StaffAuthService } from './staff-auth.service';
import { StaffSendOtpDto, StaffVerifyOtpDto } from './dto/staff-auth.dto';

@ApiTags('Staff - Auth')
@Controller('staff/auth')
export class StaffAuthController {
  constructor(private staffAuthService: StaffAuthService) {}

  @Post('send-otp')
  sendOtp(@Body() dto: StaffSendOtpDto) {
    return this.staffAuthService.sendOtp(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: StaffVerifyOtpDto) {
    return this.staffAuthService.verifyOtp(dto);
  }
}
