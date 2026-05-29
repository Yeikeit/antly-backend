import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsDateString, IsOptional } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { BudgetAutomationService } from './budget-automation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

class TriggerRolloverDto {
  @ApiProperty({
    required: false,
    description: 'Fecha de referencia para el rollover (ISO 8601). El mes de esta fecha se considera el "mes nuevo". Si se omite, se usa la fecha actual.',
    example: '2026-06-01',
  })
  @IsOptional()
  @IsDateString()
  referenceDate?: string;
}

@ApiTags('Budget Automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budget-automation')
export class BudgetAutomationController {
  constructor(private readonly automationService: BudgetAutomationService) {}

  @ApiOperation({
    summary: 'Disparar rollover de presupuesto manualmente',
    description:
      'Ejecuta el proceso de cierre del mes anterior y creación del mes siguiente para todos los usuarios con automatización activa. Acepta una fecha de referencia opcional para pruebas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Rollover ejecutado. Retorna cuántos usuarios fueron procesados y cuántos errores hubo.',
    schema: {
      example: { processed: 3, errors: 0, referenceDate: '2026-06-01T00:00:00.000Z' },
    },
  })
  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async trigger(@Body() dto: TriggerRolloverDto) {
    const date = dto.referenceDate ? new Date(dto.referenceDate) : new Date();
    const result = await this.automationService.runRollover(date);
    return { ...result, referenceDate: date.toISOString() };
  }
}
