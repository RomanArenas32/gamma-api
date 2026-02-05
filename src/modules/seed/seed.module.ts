import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { CreateSuperAdminCommand } from './commands/create-super-admin.command';
import { SeedCitiesCommand } from './commands/seed-cities.command';
import { UsersModule } from '../users/users.module';
import { CitiesModule } from '../cities/cities.module';

@Module({
  imports: [CommandModule, UsersModule, CitiesModule],
  providers: [CreateSuperAdminCommand, SeedCitiesCommand],
})
export class SeedModule {}
