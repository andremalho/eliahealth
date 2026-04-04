import { Controller, Post, Body, Headers, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Hl7v2Service } from './hl7v2.service.js';
import { Public } from '../../auth/decorators/public.decorator.js';

@Controller('hl7')
export class Hl7Controller {
  constructor(private readonly hl7: Hl7v2Service) {}

  @Public()
  @Post('receive')
  receive(@Body() body: string | Record<string, unknown>, @Res() res: Response) {
    const raw = typeof body === 'string' ? body : (body as any).message ?? '';
    const parsed = this.hl7.parseMessage(raw);

    const mshLine = raw.split(/\r?\n/).find((l: string) => l.startsWith('MSH')) ?? '';
    const ack = this.hl7.generateACK(mshLine, parsed.data ? 'AA' : 'AE');

    res.set('Content-Type', 'text/plain');
    res.send(ack);
  }
}
