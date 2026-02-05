import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './services/events.service';
import { EventUpdatesService } from './services/event-updates.service';
import { EventsController } from './controllers/events.controller';
import { EventsRepository } from './repositories/events.repository';
import { EventUpdatesRepository } from './repositories/event-updates.repository';
import { Event } from './entities/event.entity';
import { EventUpdate } from './entities/event-update.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventUpdate])],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventUpdatesService,
    EventsRepository,
    EventUpdatesRepository,
  ],
  exports: [EventsService, EventUpdatesService],
})
export class EventsModule {}
