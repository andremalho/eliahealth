import { Injectable } from '@nestjs/common';

const RNDS_BASE = 'http://rnds.saude.gov.br/fhir/r4';

/**
 * Converts EliaHealth entities to FHIR R4 resources using RNDS Brazilian profiles.
 * Reference: https://simplifier.net/redenacionaldedadosemsaude
 */
@Injectable()
export class FhirService {
  // ── RNDS-PACIENTE ──
  patientToFhir(patient: Record<string, unknown>) {
    const nameParts = ((patient.fullName as string) ?? '').split(' ');
    return {
      resourceType: 'Patient',
      meta: { profile: [`${RNDS_BASE}/StructureDefinition/BRIndividuo-1.0`] },
      identifier: [
        { system: `${RNDS_BASE}/NamingSystem/cpf`, value: patient.cpf },
        ...(patient.cns ? [{ system: `${RNDS_BASE}/NamingSystem/cns`, value: patient.cns }] : []),
      ],
      name: [{
        use: 'official',
        family: nameParts.pop(),
        given: nameParts,
      }],
      birthDate: patient.dateOfBirth,
      gender: 'female',
      telecom: [
        ...(patient.phone ? [{ system: 'phone', value: patient.phone, use: 'mobile' }] : []),
        ...(patient.email ? [{ system: 'email', value: patient.email }] : []),
      ],
      address: patient.address ? [{
        use: 'home',
        line: [patient.address as string],
        city: patient.city,
        state: patient.state,
        postalCode: patient.zipCode,
        country: 'BR',
      }] : [],
      extension: patient.ethnicity ? [{
        url: `${RNDS_BASE}/StructureDefinition/BRRacaCorEtnia-1.0`,
        valueCodeableConcept: { text: patient.ethnicity },
      }] : [],
    };
  }

  // ── RNDS-CONJUNTO-RESULTADOS-EXAME ──
  labResultToFhir(labResult: Record<string, unknown>) {
    return {
      resourceType: 'Observation',
      meta: { profile: [`${RNDS_BASE}/StructureDefinition/BRDiagnosticoLaboratorioClinico-1.0`] },
      status: 'final',
      code: {
        coding: [
          ...(labResult.loincCode ? [{ system: 'http://loinc.org', code: labResult.loincCode, display: labResult.examName }] : []),
          ...(labResult.tussCode ? [{ system: 'http://www.ans.gov.br/tiss/tuss', code: labResult.tussCode }] : []),
        ],
        text: labResult.examName as string,
      },
      valueQuantity: labResult.value ? {
        value: parseFloat(labResult.value as string),
        unit: labResult.unit,
        system: 'http://unitsofmeasure.org',
      } : undefined,
      effectiveDateTime: labResult.resultDate,
      interpretation: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: labResult.status === 'normal' ? 'N' : (labResult.status === 'critical' ? 'AA' : 'A'),
          display: labResult.status === 'normal' ? 'Normal' : 'Abnormal',
        }],
      }],
      referenceRange: (labResult.referenceMin || labResult.referenceMax) ? [{
        low: labResult.referenceMin ? { value: Number(labResult.referenceMin), unit: labResult.unit as string } : undefined,
        high: labResult.referenceMax ? { value: Number(labResult.referenceMax), unit: labResult.unit as string } : undefined,
      }] : undefined,
    };
  }

  // ── RNDS-REGISTRO-IMUNOBIOLOGICO ──
  vaccineToFhir(vaccine: Record<string, unknown>) {
    return {
      resourceType: 'Immunization',
      meta: { profile: [`${RNDS_BASE}/StructureDefinition/BRImunobiologicoAdministrado-1.0`] },
      status: vaccine.status === 'administered' ? 'completed' : 'not-done',
      vaccineCode: {
        coding: vaccine.cnesCode
          ? [{ system: `${RNDS_BASE}/CodeSystem/BRImunobiologico`, code: vaccine.cnesCode }]
          : [],
        text: vaccine.vaccineName as string,
      },
      occurrenceDateTime: vaccine.administeredDate,
      lotNumber: vaccine.lotNumber as string | undefined,
      doseQuantity: { value: vaccine.doseNumber as number },
      protocolApplied: [{
        doseNumberPositiveInt: vaccine.doseNumber as number,
        seriesDosesString: vaccine.totalDosesRequired ? `${vaccine.totalDosesRequired}` : undefined,
      }],
    };
  }

  // ── RNDS-ATENDIMENTO-INDIVIDUAL ──
  encounterToFhir(consultation: Record<string, unknown>) {
    return {
      resourceType: 'Encounter',
      meta: { profile: [`${RNDS_BASE}/StructureDefinition/BRContatoAssistencial-1.0`] },
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'ambulatory',
      },
      type: [{
        coding: [{
          system: 'http://www.datasus.gov.br/cid10',
          code: 'Z34',
          display: 'Supervisao de gravidez normal',
        }],
      }],
      period: { start: consultation.date },
      serviceProvider: consultation.cnesCode ? {
        identifier: { system: `${RNDS_BASE}/NamingSystem/cnes`, value: consultation.cnesCode },
      } : undefined,
      participant: consultation.crm ? [{
        individual: {
          identifier: { system: `${RNDS_BASE}/NamingSystem/crm`, value: consultation.crm },
        },
      }] : [],
    };
  }

  pregnancyToFhir(pregnancy: Record<string, unknown>) {
    return {
      resourceType: 'Condition',
      code: { coding: [{ system: 'http://snomed.info/sct', code: '77386006', display: 'Pregnancy' }] },
      clinicalStatus: { coding: [{ code: pregnancy.status === 'active' ? 'active' : 'resolved' }] },
      onsetDateTime: pregnancy.lmpDate,
    };
  }
}
