import { GoogleGenAI } from '@google/genai';
import {
    BadGatewayException,
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ProcessFinancialInputDto } from './dto/process-financial-input.dto';
import { StructuredTransactionDto } from './dto/structured-transaction.dto';

type GeminiResponseShape = {
  transactions?: unknown[];
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: configService.getOrThrow<string>('GEMINI_API_KEY'),
    });
    this.model = configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.0-flash';
  }

  async processFinancialInput(payload: ProcessFinancialInputDto) {
    if (!payload.input.trim()) {
      throw new BadRequestException('Input must not be empty');
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: this.buildPrompt(payload.input),
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new BadGatewayException('AI returned an empty response');
      }

      const parsed = this.parseResponse(rawText);
      return {
        transactions: this.validateTransactions(parsed.transactions ?? []),
      };
    } catch (error) {
      if (
        error instanceof BadGatewayException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new BadGatewayException('AI returned invalid JSON');
      }

      this.logger.error('Gemini request failed', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Unable to process financial input with AI');
    }
  }

  private buildPrompt(input: string): string {
    return [
      'Você é um extrator financeiro.',
      'Retorne apenas JSON válido e estrito, sem markdown e sem texto adicional.',
      'Formato exato esperado:',
      '{"transactions":[{"descricao":"string","valorOriginal":0,"valorFinal":0,"dataVencimento":"ISO-8601","categoria":"string","tipo":"entrada|saida","status":"pendente|pago|historico","saldoMutation":0}]}',
      'Regras:',
      '- Sempre responda com a chave transactions.',
      '- valorOriginal e valorFinal devem ser >= 0.',
      '- saldoMutation deve ser positivo para entrada e negativo para saída.',
      '- Quando a data não estiver explícita, use a data atual em ISO-8601.',
      '- categorias devem ser curtas e em minúsculas.',
      `Texto do usuário: ${input}`,
    ].join('\n');
  }

  private parseResponse(rawText: string): GeminiResponseShape {
    const parsed = JSON.parse(rawText) as GeminiResponseShape;

    if (!Array.isArray(parsed.transactions)) {
      throw new BadGatewayException('AI response must contain a transactions array');
    }

    return parsed;
  }

  private validateTransactions(transactions: unknown[]): StructuredTransactionDto[] {
    const instances = plainToInstance(StructuredTransactionDto, transactions);
    const errors = instances.flatMap((transaction) =>
      validateSync(transaction, {
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    if (errors.length > 0) {
      throw new BadGatewayException('AI response does not match the expected transaction schema');
    }

    return instances;
  }
}
