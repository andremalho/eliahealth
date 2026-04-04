import { Injectable } from '@nestjs/common';

/**
 * Converts EliaHealth entities to FHIR R4 resources.
 * Reference: https://www.hl7.org/fhir/R4/
 */
@Injectable()
export class FhirService {
  patientToFhir(patient: Record<string, unknown>) {
    return {
      resourceType: 'Patient',
      identifier: [{ system: 'urn:oid:2.16.840.1.113883.13.236', value: patient.cpf }],
      name: [{ text: patient.fullName, family: (patient.fullName as string)?.split(' ').pop(), given: [(patient.fullName as string)?.split(' ')[0]] }],
      birthDate: patient.dateOfBirth,
      telecom: [
        ...(patient.phone ? [{ system: 'phone', value: patient.phone }] : []),
        ...(patient.email ? [{ system: 'email', value: patient.email }] : []),
      ],
      address: patient.address ? [{ text: patient.address, city: patient.city, state: patient.state, postalCode: patient.zipCode }] : [],
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

  consultationToFhir(consultation: Record<string, unknown>) {
    return {
      resourceType: 'Encounter',
      status: 'finished',
      class: { code: 'AMB', display: 'ambulatory' },
      period: { start: consultation.date },
      reasonCode: consultation.subjective ? [{ text: consultation.subjective }] : [],
    };
  }

  labResultToFhir(labResult: Record<string, unknown>) {
    return {
      resourceType: 'Observation',
      status: 'final',
      code: { text: labResult.examName },
      valueQuantity: labResult.value ? { value: parseFloat(labResult.value as string), unit: labResult.unit } : undefined,
      effectiveDateTime: labResult.resultDate,
      interpretation: labResult.status === 'normal'
        ? [{ coding: [{ code: 'N', display: 'Normal' }] }]
        : [{ coding: [{ code: 'A', display: 'Abnormal' }] }],
    };
  }

  vaccineToFhir(vaccine: Record<string, unknown>) {
    return {
      resourceType: 'Immunization',
      status: vaccine.status === 'administered' ? 'completed' : 'not-done',
      vaccineCode: { text: vaccine.vaccineName },
      occurrenceDateTime: vaccine.administeredDate,
      doseQuantity: { value: vaccine.doseNumber },
    };
  }
}
