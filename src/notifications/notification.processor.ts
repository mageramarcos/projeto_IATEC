import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

export interface NotificationJobData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalBRL: number;
}

@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  // eslint-disable-next-line @typescript-eslint/require-await
  async process(job: Job<NotificationJobData>): Promise<void> {
    const { orderId, customerName, customerEmail, totalBRL } = job.data;
    // Simulate email send (only logs)

    console.log(
      `Order ${orderId} confirmed for ${customerName} <${customerEmail}> - total BRL ${totalBRL.toFixed(2)}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error('Failed to process notification', {
      id: job.id,
      error: error.message,
    });
  }
}
