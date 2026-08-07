import { IsString, IsNotEmpty, Length } from 'class-validator';

export class StaffSendOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  mobile_number: string;
}

export class StaffVerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  mobile_number: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
