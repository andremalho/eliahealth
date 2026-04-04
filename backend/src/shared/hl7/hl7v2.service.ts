import { Injectable, Logger } from '@nestjs/common';

const FIELD_SEP = '|';
const COMP_SEP = '^';

function getField(segment: string, index: number): string {
  return segment.split(FIELD_SEP)[index] ?? '';
}

function getComponent(field: string, index: number): string {
  return field.split(COMP_SEP)[index] ?? '';
}

function now(): string {
  return new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
}

@Injectable()
export class Hl7v2Service {
  private readonly logger = new Logger(Hl7v2Service.name);

  // ── PARSER ──

  parseMessage(raw: string) {
    const segments = raw.trim().split(/\r?\n/);
    const msh = segments.find((s) => s.startsWith('MSH'));
    if (!msh) return { type: 'UNKNOWN', data: null };

    const msgType = getField(msh, 8); // MSH-9
    const typeCode = getComponent(msgType, 0);
    const eventCode = getComponent(msgType, 1);

    switch (`${typeCode}^${eventCode}`) {
      case 'ADT^A01': case 'ADT^A04': case 'ADT^A08':
        return { type: 'ADT', data: this.parseADT(segments) };
      case 'ORU^R01':
        return { type: 'ORU', data: this.parseORU(segments) };
      case 'VXU^V04':
        return { type: 'VXU', data: this.parseVXU(segments) };
      case 'ORM^O01':
        return { type: 'ORM', data: this.parseORM(segments) };
      default:
        return { type: `${typeCode}^${eventCode}`, data: null };
    }
  }

  parseADT(segments: string[]) {
    const pid = segments.find((s) => s.startsWith('PID'));
    if (!pid) return null;

    return {
      cpf: getComponent(getField(pid, 3), 0),          // PID-3.1
      fullName: this.parseName(getField(pid, 5)),       // PID-5
      dateOfBirth: this.parseDate(getField(pid, 7)),    // PID-7
      phone: getComponent(getField(pid, 13), 0),        // PID-13
      sex: getField(pid, 8),                             // PID-8
    };
  }

  parseORU(segments: string[]) {
    const pid = segments.find((s) => s.startsWith('PID'));
    const obxSegments = segments.filter((s) => s.startsWith('OBX'));

    const results = obxSegments.map((obx) => ({
      loincCode: getComponent(getField(obx, 3), 0),     // OBX-3.1 LOINC
      examName: getComponent(getField(obx, 3), 1),      // OBX-3.2 name
      value: getField(obx, 5),                           // OBX-5
      unit: getField(obx, 6),                            // OBX-6
      referenceRange: getField(obx, 7),                  // OBX-7
      abnormalFlag: getField(obx, 8),                    // OBX-8 (N/H/L/A)
      status: this.mapAbnormalFlag(getField(obx, 8)),
    }));

    return {
      patientCpf: pid ? getComponent(getField(pid, 3), 0) : null,
      results,
    };
  }

  parseVXU(segments: string[]) {
    const rxa = segments.find((s) => s.startsWith('RXA'));
    const pid = segments.find((s) => s.startsWith('PID'));
    if (!rxa) return null;

    return {
      patientCpf: pid ? getComponent(getField(pid, 3), 0) : null,
      administeredDate: this.parseDate(getField(rxa, 3)),  // RXA-3
      vaccineCode: getComponent(getField(rxa, 5), 0),       // RXA-5.1
      vaccineName: getComponent(getField(rxa, 5), 1),       // RXA-5.2
      lotNumber: getField(rxa, 15),                          // RXA-15
    };
  }

  parseORM(segments: string[]) {
    const obr = segments.find((s) => s.startsWith('OBR'));
    const pid = segments.find((s) => s.startsWith('PID'));
    if (!obr) return null;

    return {
      patientCpf: pid ? getComponent(getField(pid, 3), 0) : null,
      examCode: getComponent(getField(obr, 4), 0),   // OBR-4.1
      examName: getComponent(getField(obr, 4), 1),   // OBR-4.2
      requestDate: this.parseDate(getField(obr, 6)),  // OBR-6
    };
  }

  // ── GENERATOR ──

  patientToHL7ADT(patient: Record<string, unknown>): string {
    const lines = [
      `MSH|^~\\&|ELIAHEALTH|ELIA|DEST|DEST|${now()}||ADT^A01|${Date.now()}|P|2.5|||AL|BR`,
      `PID|||${patient.cpf}^^^BR^CPF||${this.formatName(patient.fullName as string)}||${this.formatDate(patient.dateOfBirth as string)}|F|||${patient.address ?? ''}^^${patient.city ?? ''}^${patient.state ?? ''}^${patient.zipCode ?? ''}||${patient.phone ?? ''}`,
    ];
    return lines.join('\r');
  }

  consultationToHL7ORU(data: { patient: Record<string, unknown>; results: { examName: string; value: string; unit: string; referenceRange?: string; abnormalFlag?: string }[] }): string {
    const lines = [
      `MSH|^~\\&|ELIAHEALTH|ELIA|DEST|DEST|${now()}||ORU^R01|${Date.now()}|P|2.5|||AL|BR`,
      `PID|||${data.patient.cpf}^^^BR^CPF||${this.formatName(data.patient.fullName as string)}`,
    ];
    data.results.forEach((r, i) => {
      lines.push(`OBX|${i + 1}|NM|${r.examName}||${r.value}|${r.unit}|${r.referenceRange ?? ''}|${r.abnormalFlag ?? 'N'}`);
    });
    return lines.join('\r');
  }

  vaccineToHL7VXU(data: { patient: Record<string, unknown>; vaccine: Record<string, unknown> }): string {
    return [
      `MSH|^~\\&|ELIAHEALTH|ELIA|DEST|DEST|${now()}||VXU^V04|${Date.now()}|P|2.5|||AL|BR`,
      `PID|||${data.patient.cpf}^^^BR^CPF||${this.formatName(data.patient.fullName as string)}`,
      `RXA|0|1|${this.formatDate(data.vaccine.administeredDate as string)}||${data.vaccine.vaccineCode ?? ''}^${data.vaccine.vaccineName}^CVX|||||||||||${data.vaccine.lotNumber ?? ''}`,
    ].join('\r');
  }

  generateACK(originalMsh: string, ackCode = 'AA'): string {
    const msgId = getField(originalMsh, 9);
    return [
      `MSH|^~\\&|ELIAHEALTH|ELIA|DEST|DEST|${now()}||ACK|${Date.now()}|P|2.5`,
      `MSA|${ackCode}|${msgId}`,
    ].join('\r');
  }

  // ── Helpers ──

  private parseName(field: string): string {
    const family = getComponent(field, 0);
    const given = getComponent(field, 1);
    return `${given} ${family}`.trim();
  }

  private formatName(name: string): string {
    const parts = name.split(' ');
    const family = parts.pop() ?? '';
    return `${family}^${parts.join(' ')}`;
  }

  private parseDate(field: string): string | null {
    if (!field || field.length < 8) return null;
    return `${field.substring(0, 4)}-${field.substring(4, 6)}-${field.substring(6, 8)}`;
  }

  private formatDate(date: string): string {
    if (!date) return '';
    return date.replace(/-/g, '');
  }

  private mapAbnormalFlag(flag: string): string {
    switch (flag?.toUpperCase()) {
      case 'H': case 'HH': return 'attention';
      case 'L': case 'LL': return 'attention';
      case 'A': case 'AA': return 'critical';
      default: return 'normal';
    }
  }
}
