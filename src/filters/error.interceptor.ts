import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class GrpcErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        const value = err instanceof RpcException;
        console.log('check if the error is an instance of rpc error', value);

        if (err && err.code !== undefined && err.message) {
          // Transform gRPC error to HTTP error response
          console.log('inside the if check in the interceptor', err);
          console.log('checking actual error body', err.error);

          const statusCode = this.mapGrpcStatusCodeToHttpStatus(err.code);
          return throwError(() => ({
            statusCode,
            message: err.message || 'An error occurred',
            details: err.details || 'No additional details provided',
          }));
        }
        return throwError(() => err);
      }),
    );
  }

  private mapGrpcStatusCodeToHttpStatus(code: number): number {
    console.log('Mapping gRPC status code to HTTP status:', code);
    switch (code) {
      case 3: // INVALID_ARGUMENT
        return 400;
      case 16: // UNAUTHENTICATED
        return 401;
      case 7: // PERMISSION_DENIED
        return 403;
      case 5: // NOT_FOUND
        return 404;
      case 6: // ALREADY_EXISTS
        return 409;
      default:
        console.log('code', code);
        return 500;
    }
  }
}
