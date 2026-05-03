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
import { IncomeSourcesService } from './income-sources.service';
import { CreateIncomeSourceDto, UpdateIncomeSourceDto } from './dto/income-source.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Income Sources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('income-sources')
export class IncomeSourcesController {
  constructor(private readonly incomeSourcesService: IncomeSourcesService) {}

  @ApiOperation({ summary: 'Crear fuente de ingreso' })
  @ApiResponse({ status: 201, description: 'Fuente de ingreso creada' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateIncomeSourceDto) {
    return this.incomeSourcesService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'Listar fuentes de ingreso del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de fuentes de ingreso' })
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.incomeSourcesService.findAll(user.sub);
  }

  @ApiOperation({ summary: 'Obtener una fuente de ingreso por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la fuente de ingreso' })
  @ApiResponse({ status: 200, description: 'Fuente de ingreso encontrada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.incomeSourcesService.findOne(user.sub, id);
  }

  @ApiOperation({ summary: 'Actualizar fuente de ingreso' })
  @ApiParam({ name: 'id', description: 'UUID de la fuente de ingreso' })
  @ApiResponse({ status: 200, description: 'Fuente de ingreso actualizada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncomeSourceDto,
  ) {
    return this.incomeSourcesService.update(user.sub, id, dto);
  }

  @ApiOperation({ summary: 'Eliminar fuente de ingreso' })
  @ApiParam({ name: 'id', description: 'UUID de la fuente de ingreso' })
  @ApiResponse({ status: 204, description: 'Eliminada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.incomeSourcesService.remove(user.sub, id);
  }
}
