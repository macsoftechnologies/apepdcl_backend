import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already in the standard format, return it as is
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data
        ) {
          return data;
        }

        // If the service returned an object with items and pagination metadata
        if (
          data &&
          typeof data === 'object' &&
          'items' in data &&
          'total' in data
        ) {
          const { items, total, page, limit, message } = data;
          const limitVal = limit || 10;
          return {
            success: true,
            message: message || 'Operation successful',
            data: items,
            total,
            page: page || 1,
            limit: limitVal,
            totalPages: Math.ceil(total / limitVal),
          };
        }

        // Default transform for single objects or simple arrays
        return {
          success: true,
          message: data?.message || 'Operation successful',
          data: data?.data !== undefined ? data.data : data,
        };
      }),
    );
  }
}
