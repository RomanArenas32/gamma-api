import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEventUpdateDto {
  @ApiProperty({
    description: 'Hora de la actualización',
    example: '2026-02-15T10:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  updateTime: string;

  @ApiPropertyOptional({
    description: 'Número de personas presentes',
    example: 20,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  attendeeCount?: number;

  @ApiProperty({
    description: 'Presencia policial',
    example: true,
    default: false,
  })
  @IsBoolean()
  policePresence: boolean;

  @ApiProperty({
    description: 'Corte de calle',
    example: false,
    default: false,
  })
  @IsBoolean()
  streetClosure: boolean;

  @ApiPropertyOptional({
    description: 'Notas o comentarios adicionales',
    example: 'Manifestación pacífica, sin incidentes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
