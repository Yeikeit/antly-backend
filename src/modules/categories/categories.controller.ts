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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryTreeDto } from './dto/category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Listar categorías del usuario en árbol (padre + subcategorías)' })
  @ApiResponse({ status: 200, type: [CategoryTreeDto] })
  @Get()
  findAll(@CurrentUser() user: JwtPayload): Promise<CategoryTreeDto[]> {
    return this.categoriesService.findAllByUser(user.sub);
  }

  @ApiOperation({ summary: 'Crear nueva categoría' })
  @ApiResponse({ status: 201, description: 'Categoría creada' })
  @ApiResponse({ status: 409, description: 'Ya existe una categoría con ese nombre' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'Actualizar nombre, orden o estado de una categoría' })
  @ApiParam({ name: 'id', description: 'UUID de la categoría' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.sub, id, dto);
  }

  @ApiOperation({ summary: 'Desactivar (soft-delete) una categoría' })
  @ApiParam({ name: 'id', description: 'UUID de la categoría' })
  @ApiResponse({ status: 204, description: 'Categoría desactivada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(user.sub, id);
  }
}
