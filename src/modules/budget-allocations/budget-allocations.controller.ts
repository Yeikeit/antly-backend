import {
  Controller,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BudgetAllocationsService } from './budget-allocations.service';
import { UpsertAllocationDto } from './dto/create-budget-allocation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Budget Allocations')
@UseGuards(JwtAuthGuard)
@Controller('budgets/:budgetId/allocations')
export class BudgetAllocationsController {
  constructor(private readonly budgetAllocationsService: BudgetAllocationsService) {}

  // PUT es idempotente: crea si no existe, actualiza si existe
  @ApiOperation({ summary: 'Crear o actualizar asignación de presupuesto para una categoría' })
  @Put()
  @HttpCode(HttpStatus.OK)
  upsert(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Body() dto: UpsertAllocationDto,
  ) {
    return this.budgetAllocationsService.upsert(user.sub, budgetId, dto);
  }

  @ApiOperation({ summary: 'Eliminar asignación de presupuesto para una categoría' })
  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.budgetAllocationsService.remove(user.sub, budgetId, categoryId);
  }
}
