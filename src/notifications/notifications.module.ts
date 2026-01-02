import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'notification' })],
  providers: [NotificationProcessor],
  exports: [BullModule],
})
export class NotificationsModule {}
