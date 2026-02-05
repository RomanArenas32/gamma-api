import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventUpdatesRepository } from '../repositories/event-updates.repository';
import { EventsRepository } from '../repositories/events.repository';
import { CreateEventUpdateDto } from '../dto';
import { EventUpdate } from '../entities/event-update.entity';

@Injectable()
export class EventUpdatesService {
  constructor(
    private readonly eventUpdatesRepository: EventUpdatesRepository,
    private readonly eventsRepository: EventsRepository,
  ) {}

  async create(
    eventId: string,
    createEventUpdateDto: CreateEventUpdateDto,
    userId: string,
  ): Promise<EventUpdate> {
    // Verificar que el evento existe
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Evento con ID ${eventId} no encontrado`);
    }

    const eventUpdate = this.eventUpdatesRepository.create({
      ...createEventUpdateDto,
      eventId,
      createdById: userId,
    });

    return this.eventUpdatesRepository.save(eventUpdate);
  }

  async findByEvent(eventId: string): Promise<EventUpdate[]> {
    return this.eventUpdatesRepository.find({
      where: { eventId },
      order: { updateTime: 'DESC' },
      relations: ['createdBy'],
    });
  }

  async findOne(id: string): Promise<EventUpdate> {
    const eventUpdate = await this.eventUpdatesRepository.findOne({
      where: { id },
      relations: ['event', 'createdBy'],
    });

    if (!eventUpdate) {
      throw new NotFoundException(`Actualización con ID ${id} no encontrada`);
    }

    return eventUpdate;
  }

  async remove(id: string, userId: string): Promise<void> {
    const eventUpdate = await this.findOne(id);

    // Solo el creador puede eliminar
    if (eventUpdate.createdById !== userId) {
      throw new ForbiddenException(
        'Solo puedes eliminar tus propias actualizaciones',
      );
    }

    await this.eventUpdatesRepository.remove(eventUpdate);
  }
}
