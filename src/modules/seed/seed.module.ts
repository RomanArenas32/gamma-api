import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { CreateSuperAdminCommand } from './commands/create-super-admin.command';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CommandModule, UsersModule],
  providers: [CreateSuperAdminCommand],
})
export class SeedModule {}
