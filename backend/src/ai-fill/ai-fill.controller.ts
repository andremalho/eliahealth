import { Controller, Post, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { AiFillService } from './ai-fill.service.js';
import { AiFillDto } from './dto/ai-fill.dto.js';

@Controller()
export class AiFillController {
  constructor(private readonly service: AiFillService) {}

  @Post('pregnancies/:pregnancyId/ai-fill')
  parseAndFill(
    @Param('pregnancyId', ParseUUIDPipe) _pregnancyId: string,
    @Body() dto: AiFillDto,
  ) {
    return this.service.parseAndFill(dto.text);
  }
}
