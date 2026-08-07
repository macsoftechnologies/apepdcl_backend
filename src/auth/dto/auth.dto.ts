import { IsString, IsNotEmpty, Length } from 'class-validator';

export class AdminSendOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  mobile_number: string;
}

export class AdminVerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  mobile_number: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
