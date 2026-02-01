import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { EventType, EventStatus } from '../entities/event.entity';
import { PaginationQueryDto } from '../../common/dto';

export class QueryEventDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de evento',
    enum: EventType,
  })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: EventStatus,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por ciudad',
    example: 'La Plata',
  })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrar eventos desde esta fecha',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filtrar eventos hasta esta fecha',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
