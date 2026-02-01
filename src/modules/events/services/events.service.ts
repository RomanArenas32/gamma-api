import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventsRepository } from '../repositories/events.repository';
import { CreateEventDto, UpdateEventDto, QueryEventDto } from '../dto';
import { Event, EventStatus } from '../entities/event.entity';
import { PaginatedResponse } from '../../common/dto';
import { Between, Like } from 'typeorm';
import { UserRole } from '../../common/types/roles';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async create(
    createEventDto: CreateEventDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Event> {
    // Los usuarios level_4 (standard user) necesitan aprobación
    // Los usuarios level_3+ (moderador o superior) se auto-aprueban
    const status =
      userRole === UserRole.LEVEL_4
        ? EventStatus.PENDING
        : EventStatus.APPROVED;

    const event = this.eventsRepository.create({
      ...createEventDto,
      createdById: userId,
      status,
      province: 'Buenos Aires', // Por defecto Buenos Aires
    });

    return this.eventsRepository.save(event);
  }

  async findAll(queryDto: QueryEventDto): Promise<PaginatedResponse<Event>> {
    const {
      page = 1,
      limit = 10,
      search,
      eventType,
      status,
      city,
      dateFrom,
      dateTo,
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, any> = {};

    if (search) {
      where.title = Like(`%${search}%`);
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (status) {
      where.status = status;
    }

    if (city) {
      where.city = Like(`%${city}%`);
    }

    if (dateFrom && dateTo) {
      where.eventDate = Between(new Date(dateFrom), new Date(dateTo));
    } else if (dateFrom) {
      where.eventDate = Between(new Date(dateFrom), new Date('2099-12-31'));
    } else if (dateTo) {
      where.eventDate = Between(new Date('2000-01-01'), new Date(dateTo));
    }

    const [data, total] = await this.eventsRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { eventDate: 'ASC', createdAt: 'DESC' },
      relations: ['createdBy'],
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Event> {
    const event = await this.findOne(id);

    // Solo el creador o admin/moderador pueden editar
    const isOwner = event.createdById === userId;
    const isModerator = [
      UserRole.LEVEL_1,
      UserRole.LEVEL_2,
      UserRole.LEVEL_3,
    ].includes(userRole);

    if (!isOwner && !isModerator) {
      throw new ForbiddenException('You can only edit your own events');
    }

    // Solo admin/moderador pueden cambiar el estado
    if (updateEventDto.status && !isModerator) {
      throw new ForbiddenException('Only moderators can change event status');
    }

    Object.assign(event, updateEventDto);

    return this.eventsRepository.save(event);
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const event = await this.findOne(id);

    // Solo el creador o admin pueden eliminar
    const isOwner = event.createdById === userId;
    const isAdmin = [UserRole.LEVEL_1, UserRole.LEVEL_2].includes(userRole);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own events');
    }

    await this.eventsRepository.remove(event);
  }

  // Obtener eventos aprobados para el mapa (sin paginación)
  async findApprovedForMap(): Promise<Event[]> {
    return this.eventsRepository.find({
      where: { status: EventStatus.APPROVED },
      order: { eventDate: 'ASC' },
      relations: ['createdBy'],
    });
  }

  // Obtener eventos pendientes de aprobación
  async findPending(
    queryDto: QueryEventDto,
  ): Promise<PaginatedResponse<Event>> {
    return this.findAll({ ...queryDto, status: EventStatus.PENDING });
  }
}
