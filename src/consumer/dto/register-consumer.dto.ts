import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class RegisterConsumerDto {
  @IsString()
  @IsNotEmpty()
  mobile_number: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  service_connection_number: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @IsNotEmpty()
  gps_lat: number;

  @IsNumber()
  @IsNotEmpty()
  gps_lng: number;
}
