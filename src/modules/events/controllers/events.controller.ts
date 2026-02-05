import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EventsService } from '../services/events.service';
import { EventUpdatesService } from '../services/event-updates.service';
import { CreateEventDto, UpdateEventDto, QueryEventDto, CreateEventUpdateDto } from '../dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/types/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@ApiTags('Events')
@ApiBearerAuth('JWT-auth')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventUpdatesService: EventUpdatesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new event',
    description:
      'Any authenticated user can create events. Level 4 users need approval.',
  })
  @ApiResponse({
    status: 201,
    description: 'Event successfully created',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createEventDto: CreateEventDto, @CurrentUser() user: User) {
    return this.eventsService.create(createEventDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all events with pagination and filters',
    description: 'Get paginated list of events with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of events',
  })
  findAll(@Query() query: QueryEventDto) {
    return this.eventsService.findAll(query);
  }

  @Get('map')
  @Roles(UserRole.LEVEL_1, UserRole.LEVEL_2, UserRole.LEVEL_3)
  @ApiOperation({
    summary: 'Get all approved events for map display',
    description: 'Only approved events without pagination for map markers',
  })
  @ApiResponse({
    status: 200,
    description: 'List of approved events',
  })
  findForMap() {
    return this.eventsService.findApprovedForMap();
  }

  @Get('pending')
  @Roles(UserRole.LEVEL_1, UserRole.LEVEL_2, UserRole.LEVEL_3)
  @ApiOperation({
    summary: 'Get pending events for moderation',
    description: 'Only moderators and admins can see pending events',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of pending events',
  })
  findPending(@Query() query: QueryEventDto) {
    return this.eventsService.findPending(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get event by ID',
    description: 'Get detailed information about a specific event',
  })
  @ApiParam({
    name: 'id',
    description: 'Event UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Event found',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update event',
    description: 'Update event. Only owner or moderator+ can edit.',
  })
  @ApiParam({
    name: 'id',
    description: 'Event UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Event successfully updated',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    return this.eventsService.update(id, updateEventDto, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete event',
    description: 'Delete event. Only owner or admin can delete.',
  })
  @ApiParam({
    name: 'id',
    description: 'Event UUID',
  })
  @ApiResponse({ status: 204, description: 'Event successfully deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eventsService.remove(id, user.id, user.role);
  }

  // Event Updates routes
  @Post(':id/updates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar actualización a un evento',
    description: 'Registrar un nuevo seguimiento del evento con datos en tiempo real',
  })
  @ApiParam({
    name: 'id',
    description: 'Event UUID',
  })
  @ApiResponse({
    status: 201,
    description: 'Actualización registrada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  createUpdate(
    @Param('id') eventId: string,
    @Body() createEventUpdateDto: CreateEventUpdateDto,
    @CurrentUser() user: User,
  ) {
    return this.eventUpdatesService.create(
      eventId,
      createEventUpdateDto,
      user.id,
    );
  }

  @Get(':id/updates')
  @ApiOperation({
    summary: 'Obtener historial de actualizaciones de un evento',
    description: 'Ver todas las actualizaciones registradas de un evento específico',
  })
  @ApiParam({
    name: 'id',
    description: 'Event UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de actualizaciones',
  })
  getUpdates(@Param('id') eventId: string) {
    return this.eventUpdatesService.findByEvent(eventId);
  }

  @Delete(':eventId/updates/:updateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una actualización',
    description: 'Solo el creador puede eliminar su actualización',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event UUID',
  })
  @ApiParam({
    name: 'updateId',
    description: 'Update UUID',
  })
  @ApiResponse({ status: 204, description: 'Actualización eliminada' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Actualización no encontrada' })
  removeUpdate(
    @Param('updateId') updateId: string,
    @CurrentUser() user: User,
  ) {
    return this.eventUpdatesService.remove(updateId, user.id);
  }
}
