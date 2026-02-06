import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Not } from 'typeorm';
import { EventUpdatesRepository } from '../repositories/event-updates.repository';
import { EventsRepository } from '../repositories/events.repository';
import { CreateEventUpdateDto } from '../dto';
import { EventUpdate } from '../entities/event-update.entity';

@Injectable()
export class EventUpdatesService {
  constructor(
    private readonly eventUpdatesRepository: EventUpdatesRepository,
    @Inject(forwardRef(() => EventsRepository))
    private readonly eventsRepository: EventsRepository,
  ) {}

  async create(
    eventId: string,
    createEventUpdateDto: CreateEventUpdateDto,
    userId: string,
  ): Promise<EventUpdate> {
    // Verify that the event exists
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Use the specific time provided (now required)
    const updateTime = new Date(createEventUpdateDto.updateTime);

    const eventUpdate = this.eventUpdatesRepository.create({
      ...createEventUpdateDto,
      updateTime,
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
      throw new NotFoundException(`Update with ID ${id} not found`);
    }

    return eventUpdate;
  }

  async remove(id: string, userId: string): Promise<void> {
    const eventUpdate = await this.findOne(id);

    // Only the creator can delete
    if (eventUpdate.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own updates');
    }

    await this.eventUpdatesRepository.remove(eventUpdate);
  }

  async getEventStats(eventId: string): Promise<any> {
    const updates = await this.findByEvent(eventId);

    if (updates.length === 0) {
      return {
        totalUpdates: 0,
        maxAttendees: 0,
        minAttendees: 0,
        avgAttendees: 0,
        policePresenceDuration: 0,
        streetClosureDuration: 0,
        timeline: [],
      };
    }

    const attendeeCounts = updates
      .filter((u) => u.attendeeCount !== null && u.attendeeCount !== undefined)
      .map((u) => u.attendeeCount);

    const policeEvents = updates.filter((u) => u.policePresence);
    const streetClosureEvents = updates.filter((u) => u.streetClosure);

    return {
      totalUpdates: updates.length,
      maxAttendees: attendeeCounts.length > 0 ? Math.max(...attendeeCounts) : 0,
      minAttendees: attendeeCounts.length > 0 ? Math.min(...attendeeCounts) : 0,
      avgAttendees:
        attendeeCounts.length > 0
          ? Math.round(
              attendeeCounts.reduce((a, b) => a + b, 0) / attendeeCounts.length,
            )
          : 0,
      policePresenceOccurrences: policeEvents.length,
      streetClosureOccurrences: streetClosureEvents.length,
      firstUpdate: updates[updates.length - 1]?.updateTime,
      lastUpdate: updates[0]?.updateTime,
      timeline: updates.map((u) => ({
        time: u.updateTime,
        type: u.updateType,
        attendees: u.attendeeCount,
        notes: u.notes,
        policePresence: u.policePresence,
        streetClosure: u.streetClosure,
      })),
    };
  }

  async getTimelineForChart(eventId: string): Promise<any> {
    const updates = await this.eventUpdatesRepository.find({
      where: {
        eventId,
        attendeeCount: Not(null as any),
      },
      order: { updateTime: 'ASC' },
      select: [
        'id',
        'updateTime',
        'attendeeCount',
        'policePresence',
        'streetClosure',
        'notes',
        'updateType',
      ],
    });

    return {
      eventId,
      dataPoints: updates.map((update) => ({
        timestamp: update.updateTime,
        time: update.updateTime.toISOString(),
        attendees: update.attendeeCount,
        policePresence: update.policePresence,
        streetClosure: update.streetClosure,
        type: update.updateType,
        notes: update.notes || '',
      })),
      totalDataPoints: updates.length,
      duration:
        updates.length > 1
          ? {
              start: updates[0].updateTime,
              end: updates[updates.length - 1].updateTime,
              durationMinutes: Math.round(
                (updates[updates.length - 1].updateTime.getTime() -
                  updates[0].updateTime.getTime()) /
                  (1000 * 60),
              ),
            }
          : null,
    };
  }
}
