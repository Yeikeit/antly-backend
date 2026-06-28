import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, CloseBudgetDto, CreateBudgetWizardDto, UpdateBudgetWizardDto } from './dto/budget.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Budgets')
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) { }


  @ApiOperation({ summary: 'Crear nuevo presupuesto' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'Crear presupuesto completo desde el wizard (una sola transacción)' })
  @Post('wizard')
  @HttpCode(HttpStatus.CREATED)
  createWizard(@CurrentUser() user: JwtPayload, @Body() dto: CreateBudgetWizardDto) {
    return this.budgetsService.createWizard(user.sub, dto);
  }

  @ApiOperation({ summary: 'Obtener el presupuesto activo del mes actual' })
  @Get('current')
  findCurrent(@CurrentUser() user: JwtPayload) {
    return this.budgetsService.findCurrent(user.sub);
  }

  @ApiOperation({ summary: 'Obtener estructura del último presupuesto para copiar al wizard' })
  @Get('last-structure')
  getLastBudgetStructure(@CurrentUser() user: JwtPayload) {
    return this.budgetsService.getLastBudgetStructure(user.sub);
  }

  @ApiOperation({ summary: 'Actualizar presupuesto activo desde el wizard (reemplaza ingresos y asignaciones)' })
  @Put(':id/wizard')
  @HttpCode(HttpStatus.OK)
  updateWizard(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetWizardDto,
  ) {
    return this.budgetsService.updateWizard(user.sub, id, dto);
  }

  @ApiOperation({ summary: 'Obtener todos los presupuestos del usuario Logueado' })
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.budgetsService.findAll(user.sub);
  }

  @ApiOperation({ summary: 'Obtener presupuesto del usuario Logueado por ID' })
  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.budgetsService.findOne(user.sub, id);
  }

  @ApiOperation({ summary: 'Obtener historial de cambios de un presupuesto' })
  @Get(':id/history')
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.budgetsService.getChangeLogs(user.sub, id);
  }

  @ApiOperation({ summary: 'Obtener resumen de presupuesto del usuario Logueado por ID' })
  @Get(':id/summary')
  getSummary(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.budgetsService.getSummary(user.sub, id);
  }

  @ApiOperation({ summary: 'Cerrar presupuesto del usuario Logueado por ID' })
  @Patch(':id/close')
  @HttpCode(HttpStatus.OK)
  close(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseBudgetDto,
  ) {
    return this.budgetsService.close(user.sub, id, dto);
  }

  @ApiOperation({ summary: 'Eliminar presupuesto cerrado por ID' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.budgetsService.remove(user.sub, id);
  }

  @ApiOperation({ summary: 'Reabrir un presupuesto cerrado' })
  @Patch(':id/reopen')
  @HttpCode(HttpStatus.OK)
  reopen(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.budgetsService.reopen(user.sub, id);
  }
}
