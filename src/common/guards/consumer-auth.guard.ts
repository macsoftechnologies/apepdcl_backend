import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ConsumerAuthGuard extends AuthGuard('jwt-consumer') {}
