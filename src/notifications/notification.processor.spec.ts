import { NotificationProcessor } from './notification.processor';

type ProcessJob = Parameters<NotificationProcessor['process']>[0];
type FailedJob = Parameters<NotificationProcessor['onFailed']>[0];

const createMockJob = (): ProcessJob & FailedJob =>
  ({
    id: 'job-id',
    name: 'notification',
    data: {
      orderId: '1',
      customerName: 'Ana',
      customerEmail: 'ana@x.com',
      totalBRL: 10,
    },
  }) as ProcessJob & FailedJob;

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  const originalLog = console.log;
  const originalError = console.error;

  beforeEach(() => {
    processor = new NotificationProcessor();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
  });

  it('logs confirmation on process', () => {
    const job = createMockJob();

    void processor.process(job);

    expect(console.log).toHaveBeenCalled();
  });

  it('logs error on onFailed', () => {
    const job = createMockJob();

    processor.onFailed(job, new Error('fail'));
    expect(console.error).toHaveBeenCalled();
  });
});
