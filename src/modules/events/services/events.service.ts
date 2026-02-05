import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventsRepository } from '../repositories/events.repository';
import { CreateEventDto, UpdateEventDto, QueryEventDto } from '../dto';
import { Event, EventStatus } from '../entities/event.entity';
import { PaginatedResponse } from '../../common/dto';
import { Between, Like } from 'typeorm';
import { UserRole } from '../../common/types/roles';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) { }

  async create(
    createEventDto: CreateEventDto,
    user: User,
  ): Promise<Event> {
    if (user.role === UserRole.LEVEL_4) {
      if (!user.assignedPartidos || user.assignedPartidos.length === 0) {
        throw new ForbiddenException(
          'No tienes partidos asignados. Contacta al administrador.',
        );
      }

      if (!user.assignedPartidos.includes(createEventDto.city)) {
        throw new ForbiddenException(
          'No tienes permisos para crear eventos en este partido. Solo puedes crear eventos en: ' +
          user.assignedPartidos.join(', '),
        );
      }
    }
    const status =
      user.role === UserRole.LEVEL_4
        ? EventStatus.PENDING
        : EventStatus.APPROVED;

    const event = this.eventsRepository.create({
      ...createEventDto,
      createdById: user.id,
      status,
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

    const isOwner = event.createdById === userId;
    const isModerator = [
      UserRole.LEVEL_1,
      UserRole.LEVEL_2,
      UserRole.LEVEL_3,
    ].includes(userRole);

    if (!isOwner && !isModerator) {
      throw new ForbiddenException('You can only edit your own events');
    }

    if (updateEventDto.status && !isModerator) {
      throw new ForbiddenException('Only moderators can change event status');
    }

    Object.assign(event, updateEventDto);

    return this.eventsRepository.save(event);
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const event = await this.findOne(id);

    const isOwner = event.createdById === userId;
    const isAdmin = [UserRole.LEVEL_1, UserRole.LEVEL_2].includes(userRole);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own events');
    }

    await this.eventsRepository.remove(event);
  }

  async findApprovedForMap(): Promise<Event[]> {
    return this.eventsRepository.find({
      where: { status: EventStatus.APPROVED },
      order: { eventDate: 'ASC' },
      relations: ['createdBy'],
    });
  }

  async findPending(
    queryDto: QueryEventDto,
  ): Promise<PaginatedResponse<Event>> {
    return this.findAll({ ...queryDto, status: EventStatus.PENDING });
  }
}
