import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { City } from '../../cities/entities/city.entity';

export enum EventType {
  MANIFESTACION = 'manifestacion',
  MARCHA = 'marcha',
  CONCENTRACION = 'concentracion',
  ASAMBLEA = 'asamblea',
  OTRO = 'otro',
}

export enum EventStatus {
  PENDING = 'pending', // Esperando aprobación
  APPROVED = 'approved', // Aprobado
  REJECTED = 'rejected', // Rechazado
  ONGOING = 'ongoing', // En curso
  COMPLETED = 'completed', // Completado
  CANCELLED = 'cancelled', // Cancelado
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: EventType,
    default: EventType.OTRO,
  })
  eventType: EventType;

  @Column({ type: 'timestamp' })
  eventDate: Date;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @ManyToOne(() => City, { eager: true, nullable: false })
  @JoinColumn({ name: 'cityId' })
  city: City;

  @Column()
  cityId: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status: EventStatus;

  @Column({ type: 'int', nullable: true })
  attendeeCount: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
