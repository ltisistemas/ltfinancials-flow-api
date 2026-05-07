import {
  BadGatewayException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

describe('AiService', () => {
  const configService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'GEMINI_API_KEY') {
        return 'test-api-key';
      }

      throw new Error(`Missing config ${key}`);
    }),
    get: jest.fn(() => 'gemini-2.0-flash'),
  } as unknown as ConfigService;

  let service: AiService;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiService(configService);
    mockGenerateContent = jest.fn();

    Object.defineProperty(service, 'client', {
      value: {
        models: {
          generateContent: mockGenerateContent,
        },
      },
      configurable: true,
    });
  });

  it('returns validated structured transactions from Gemini JSON output', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        transactions: [
          {
            descricao: 'Freela',
            valorOriginal: 500,
            valorFinal: 500,
            dataVencimento: '2026-05-15T00:00:00.000Z',
            categoria: 'renda_extra',
            tipo: 'entrada',
            status: 'pago',
            saldoMutation: 500,
          },
        ],
      }),
    });

    const result = await service.processFinancialInput({
      input: 'Recebi 500 de freela dia 15',
    });

    expect(result.transactions).toHaveLength(1);
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('rejects empty input', async () => {
    await expect(
      service.processFinancialInput({
        input: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps invalid AI JSON to a gateway error', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '{invalid json',
    });

    await expect(
      service.processFinancialInput({
        input: 'Paguei a internet',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('maps upstream SDK failures to an internal server error', async () => {
    mockGenerateContent.mockRejectedValue(new Error('upstream down'));

    await expect(
      service.processFinancialInput({
        input: 'Paguei a internet',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
