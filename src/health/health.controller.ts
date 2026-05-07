import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Verifica a saúde da aplicação' })
  @ApiOkResponse({
    description: 'Aplicação disponível',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-05-07T12:00:00.000Z',
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}