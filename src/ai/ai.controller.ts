import { Body, Controller, Post } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ProcessFinancialInputDto } from './dto/process-financial-input.dto';

@ApiTags('ai')
@ApiBearerAuth('bearer')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('process-financial-input')
  @ApiOperation({
    summary: 'Processa texto financeiro em linguagem natural usando Gemini',
  })
  @ApiOkResponse({
    description: 'Transações estruturadas extraídas do texto informado.',
    schema: {
      example: {
        transactions: [
          {
            descricao: 'Internet residencial',
            valorOriginal: 120,
            valorFinal: 120,
            dataVencimento: '2026-05-12T00:00:00.000Z',
            categoria: 'servicos',
            tipo: 'saida',
            status: 'pendente',
            saldoMutation: -120,
          },
          {
            descricao: 'Freela de design',
            valorOriginal: 500,
            valorFinal: 500,
            dataVencimento: '2026-05-15T00:00:00.000Z',
            categoria: 'renda_extra',
            tipo: 'entrada',
            status: 'pago',
            saldoMutation: 500,
          },
        ],
      },
    },
  })
  processFinancialInput(@Body() payload: ProcessFinancialInputDto) {
    return this.aiService.processFinancialInput(payload);
  }
}
