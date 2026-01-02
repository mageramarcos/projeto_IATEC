import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let http: { get: jest.Mock };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CurrencyService,
        { provide: HttpService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(CurrencyService);
    http = moduleRef.get(HttpService);
  });

  it('returns bid when response is valid', async () => {
    http.get.mockReturnValue(of({ data: { USDBRL: { bid: '5.5' } } }));

    const rate = await service.getUsdBrlRate();
    expect(rate).toBe(5.5);
  });

  it('throws when bid is missing', async () => {
    http.get.mockReturnValue(of({ data: { USDBRL: { bid: undefined } } }));

    await expect(service.getUsdBrlRate()).rejects.toBeInstanceOf(Error);
  });

  it('propagates request error', async () => {
    http.get.mockReturnValue(throwError(() => new Error('fail')));

    await expect(service.getUsdBrlRate()).rejects.toThrow('fail');
  });
});
