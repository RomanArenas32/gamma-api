import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('event_updates')
export class EventUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  eventId: string;

  @Column({ type: 'timestamp' })
  updateTime: Date;

  @Column({ type: 'int', nullable: true })
  attendeeCount: number;

  @Column({ type: 'boolean', default: false })
  policePresence: boolean;

  @Column({ type: 'boolean', default: false })
  streetClosure: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
