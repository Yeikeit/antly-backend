import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Incomes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets/:budgetId/incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @ApiOperation({ summary: 'Registrar ingreso en un presupuesto' })
  @ApiParam({ name: 'budgetId', description: 'UUID del presupuesto' })
  @ApiResponse({ status: 201, description: 'Ingreso creado' })
  @ApiResponse({ status: 404, description: 'Presupuesto o fuente de ingreso no encontrados' })
  @ApiResponse({ status: 400, description: 'Presupuesto cerrado' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Body() dto: CreateIncomeDto,
  ) {
    return this.incomesService.create(user.sub, budgetId, dto);
  }

  @ApiOperation({ summary: 'Listar ingresos de un presupuesto' })
  @ApiParam({ name: 'budgetId', description: 'UUID del presupuesto' })
  @ApiResponse({ status: 200, description: 'Lista de ingresos' })
  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
  ) {
    return this.incomesService.findAll(user.sub, budgetId);
  }

  @ApiOperation({ summary: 'Obtener un ingreso por ID' })
  @ApiParam({ name: 'budgetId', description: 'UUID del presupuesto' })
  @ApiParam({ name: 'id', description: 'UUID del ingreso' })
  @ApiResponse({ status: 200, description: 'Ingreso encontrado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.incomesService.findOne(user.sub, budgetId, id);
  }

  @ApiOperation({ summary: 'Actualizar un ingreso' })
  @ApiParam({ name: 'budgetId', description: 'UUID del presupuesto' })
  @ApiParam({ name: 'id', description: 'UUID del ingreso' })
  @ApiResponse({ status: 200, description: 'Ingreso actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.incomesService.update(user.sub, budgetId, id, dto);
  }

  @ApiOperation({ summary: 'Eliminar un ingreso' })
  @ApiParam({ name: 'budgetId', description: 'UUID del presupuesto' })
  @ApiParam({ name: 'id', description: 'UUID del ingreso' })
  @ApiResponse({ status: 204, description: 'Eliminado' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.incomesService.remove(user.sub, budgetId, id);
  }
}
