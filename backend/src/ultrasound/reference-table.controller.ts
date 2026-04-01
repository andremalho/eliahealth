import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReferenceTableService } from './reference-table.service.js';
import { BiometryParameter } from './biometry-parameter.enum.js';
import { CreateReferenceTableDto } from './dto/create-reference-table.dto.js';
import { BulkImportReferenceDto } from './dto/bulk-import-reference.dto.js';

@Controller('reference-tables')
export class ReferenceTableController {
  constructor(private readonly service: ReferenceTableService) {}

  @Post()
  create(@Body() dto: CreateReferenceTableDto) {
    return this.service.create(dto);
  }

  @Post('bulk-import')
  bulkImport(@Body() dto: BulkImportReferenceDto) {
    return this.service.bulkImport(dto.rows);
  }

  @Get()
  findAll(@Query('parameter') parameter?: BiometryParameter) {
    return this.service.findAll(parameter);
  }

  @Get('calculate')
  calculate(
    @Query('parameter') parameter: BiometryParameter,
    @Query('value') value: string,
    @Query('gaWeeks') gaWeeks: string,
  ) {
    return this.service.calculatePercentile(
      parameter,
      parseFloat(value),
      parseInt(gaWeeks, 10),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateReferenceTableDto>,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/set-default')
  setDefault(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.setDefault(id);
  }

  @Delete(':id')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(id);
  }
}
