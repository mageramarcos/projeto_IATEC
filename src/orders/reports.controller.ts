import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TopClientsQueryDto } from './dto/top-clients-query.dto';
import { OrdersService } from './orders.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'List top customers by BRL spend' })
  @Get('top-customers')
  topClients(@Query() query: TopClientsQueryDto) {
    return this.ordersService.topClients(query);
  }
}
