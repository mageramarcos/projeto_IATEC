import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { CurrencyModule } from '../currency/currency.module';
import { StorageModule } from '../storage/storage.module';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ReportsController } from './reports.controller';
import { Order, OrderSchema } from './schemas/order.schema';

@Module({
  imports: [
    CurrencyModule,
    StorageModule,
    BullModule.registerQueue({ name: 'notification' }),
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [OrdersController, ReportsController],
  providers: [OrdersService],
})
export class OrdersModule {}
