import { IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertAllocationDto {
  @ApiProperty({ description: 'UUID de la categoría a presupuestar' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 500000, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  allocatedAmount: number;
}
