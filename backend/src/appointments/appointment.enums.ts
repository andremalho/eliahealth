export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  EXAM = 'exam',
  PROCEDURE = 'procedure',
  OTHER = 'other',
}

export enum AppointmentCategory {
  PRIMEIRA_CONSULTA = 'primeira_consulta',
  RETORNO = 'retorno',
  PARTICULAR = 'particular',
  CONVENIO = 'convenio',
  URGENCIA = 'urgencia',
  ENCAIXE = 'encaixe',
}
