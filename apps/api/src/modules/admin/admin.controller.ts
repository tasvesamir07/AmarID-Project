import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminKeyGuard } from '../../common/auth/admin-key.guard';

@UseGuards(AdminKeyGuard)
@Controller('v1/admin')
export class AdminController {
  constructor(private readonly s: AdminService) {}

  @Get('metrics')
  async metrics() {
    return this.s.metrics();
  }

  @Post('clients')
  async createClient(@Body() body: any) {
    return this.s.createClient(body);
  }

  @Get('clients')
  async listClients() {
    return this.s.listClients();
  }
}
