import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterConsumerDto } from './dto/register-consumer.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConsumerAuthGuard } from '../common/guards/consumer-auth.guard';

@ApiTags('Consumer - Auth')
@Controller('consumer/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterConsumerDto) {
    return this.authService.register(dto);
  }

  @ApiBearerAuth()
  @UseGuards(ConsumerAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.consumer_id);
  }
}
