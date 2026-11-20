import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '../../common/auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }

  @Get('live')
  @Public()
  live() { return { status: 'ok', service: 'amarid-api', time: new Date().toISOString() }; }
}
