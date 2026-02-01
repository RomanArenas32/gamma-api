import { PartialType } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../entities/event.entity';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({
    description: 'Estado del evento (solo admin/moderador pueden cambiar)',
    enum: EventStatus,
    example: EventStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
