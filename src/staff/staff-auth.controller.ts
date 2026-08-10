import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
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

  @ApiBearerAuth()
  @UseGuards(StaffAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.staffAuthService.getProfile(req.user.staff_id);
  }
}
