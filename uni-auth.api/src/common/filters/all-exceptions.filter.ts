import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ToClientException } from '../exceptions/to-client.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof ToClientException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      res.status(status).json({
        timestamp: new Date().toISOString(),
        path: req.url,
        ...(typeof resp === 'object' ? resp : { message: resp }),
      });
      return;
    }

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.message : 'Internal server error';

    res.status(status).json({
      timestamp: new Date().toISOString(),
      path: req.url,
      message,
    });
  }
}
