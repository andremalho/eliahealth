import { Controller, Get, Query } from '@nestjs/common';
import { BirthCalendarService } from './birth-calendar.service.js';

@Controller('birth-calendar')
export class BirthCalendarController {
  constructor(private readonly service: BirthCalendarService) {}

  @Get()
  getByMonth(@Query('month') month: string, @Query('year') year: string) {
    return this.service.getByMonth(parseInt(month, 10), parseInt(year, 10));
  }

  @Get('upcoming')
  getUpcoming(@Query('days') days?: string) {
    return this.service.getUpcoming(parseInt(days ?? '30', 10));
  }
}
