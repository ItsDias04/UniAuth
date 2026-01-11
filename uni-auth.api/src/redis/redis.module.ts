import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    // {
    //   provide: REDIS_CLIENT,
    //   useFactory: () => {
    //     const host = process.env.REDIS_HOST || '127.0.0.1';
    //     const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    //     const password = process.env.REDIS_PASS || undefined;
    //     return new Redis({ host, port, password });
    //   },
    // },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
