import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

interface AwesomeApiResponse {
  USDBRL?: {
    bid?: string;
  };
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly url = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';

  constructor(private readonly http: HttpService) {}

  async getUsdBrlRate(): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.http.get<AwesomeApiResponse>(this.url),
      );
      const bid = Number(response.data?.USDBRL?.bid);
      if (!bid || Number.isNaN(bid)) {
        throw new Error('Invalid FX response');
      }
      return bid;
    } catch (error) {
      this.logger.error(
        'Failed to fetch USD/BRL rate',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
