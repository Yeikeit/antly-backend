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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets/:budgetId/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiOperation({ summary: 'Registrar transacción en un presupuesto' })
  @ApiParam({ name: 'budgetId', description: 'UUID del presupuesto' })
  @ApiResponse({ status: 201, description: 'Transacción creada' })
  @ApiResponse({ status: 400, description: 'Tipo de transacción no coincide con la categoría o presupuesto cerrado' })
  @ApiResponse({ status: 404, description: 'Presupuesto o categoría no encontrados' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(user.sub, budgetId, dto);
  }

  @ApiOperation({ summary: 'Listar transacciones de un presupuesto' })
  @ApiParam({ name: 'budgetId', description: 'UUID del presupuesto' })
  @ApiResponse({ status: 200, description: 'Lista de transacciones' })
  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
  ) {
    return this.transactionsService.findAll(user.sub, budgetId);
  }

  @ApiOperation({ summary: 'Obtener una transacción por ID' })
  @ApiParam({ name: 'budgetId', description: 'UUID del presupuesto' })
  @ApiParam({ name: 'id', description: 'UUID de la transacción' })
  @ApiResponse({ status: 200, description: 'Transacción encontrada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.findOne(user.sub, budgetId, id);
  }

  @ApiOperation({ summary: 'Actualizar una transacción' })
  @ApiParam({ name: 'budgetId', description: 'UUID del presupuesto' })
  @ApiParam({ name: 'id', description: 'UUID de la transacción' })
  @ApiResponse({ status: 200, description: 'Transacción actualizada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(user.sub, budgetId, id, dto);
  }

  @ApiOperation({ summary: 'Eliminar una transacción' })
  @ApiParam({ name: 'budgetId', description: 'UUID del presupuesto' })
  @ApiParam({ name: 'id', description: 'UUID de la transacción' })
  @ApiResponse({ status: 204, description: 'Eliminada' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.remove(user.sub, budgetId, id);
  }
}
