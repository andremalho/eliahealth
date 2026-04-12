/**
 * EliaHealth — Seed de 140 pacientes teste
 *
 * Uso: npx ts-node -r tsconfig-paths/register src/seeds/seed-test-patients.ts
 * Ou via endpoint: POST /admin/seed-test-data (com auth SUPERADMIN)
 *
 * Distribução:
 *   25 gestantes baixo risco
 *   10 gestantes com fatores de risco sem patologia
 *   25 gestantes com patologias (PE, DMG, com medições)
 *   10 puérperas com dados do RN e contracepção
 *   20 ginecológicas (corrimento, dor pélvica, nódulos mama)
 *   20 irregularidade menstrual (todos os tipos)
 *   5 infertilidade (pesquisa)
 *   5 reprodução assistida (OI, IIU, FIV)
 *   20 clínica geral (hipertensão, diabetes, obesidade, tabagismo)
 */

import { randomUUID } from 'crypto';

// Nomes femininos brasileiros realistas
const NOMES = [
  'Ana Carolina', 'Beatriz Oliveira', 'Camila Santos', 'Daniela Ferreira', 'Eduarda Lima',
  'Fernanda Costa', 'Gabriela Souza', 'Helena Rodrigues', 'Isabela Martins', 'Julia Almeida',
  'Karla Pereira', 'Larissa Goncalves', 'Mariana Ribeiro', 'Natalia Carvalho', 'Olivia Mendes',
  'Patricia Araujo', 'Rafaela Barbosa', 'Sabrina Nascimento', 'Tatiana Moreira', 'Ursula Dias',
  'Vanessa Cardoso', 'Wanda Correia', 'Yasmin Teixeira', 'Zilda Monteiro', 'Amanda Cunha',
  'Bruna Vieira', 'Carolina Ramos', 'Diana Nunes', 'Elisa Machado', 'Flavia Pinto',
  'Giovanna Rocha', 'Heloisa Azevedo', 'Iris Campos', 'Joana Freitas', 'Kelly Borges',
  'Leticia Reis', 'Monica Duarte', 'Nadia Castro', 'Priscila Lopes', 'Raquel Melo',
  'Simone Fonseca', 'Tais Andrade', 'Vitoria Braga', 'Aline Moura', 'Barbara Coelho',
  'Claudia Xavier', 'Debora Pires', 'Erica Guimaraes', 'Fabiana Tavares', 'Grace Batista',
  'Hilda Nogueira', 'Ivana Silveira', 'Janaina Siqueira', 'Lilian Amaral', 'Miriam Medeiros',
  'Noemia Alencar', 'Paula Figueiredo', 'Regina Vasconcelos', 'Sandra Sampaio', 'Teresa Aguiar',
  'Valeria Lacerda', 'Aparecida Brito', 'Bianca Rangel', 'Cecilia Barreto', 'Denise Franco',
  'Eliane Pinheiro', 'Fatima Cordeiro', 'Gloria Matos', 'Ingrid Cavalcanti', 'Jaqueline Sales',
  'Karina Rego', 'Laura Pacheco', 'Mercedes Assis', 'Neuza Queiroz', 'Odete Magalhaes',
  'Paloma Toledo', 'Renata Sena', 'Sonia Resende', 'Thais Fontes', 'Vera Macedo',
  'Adriana Paiva', 'Bernadete Leite', 'Cristina Chaves', 'Dolores Menezes', 'Eunice Torres',
  'Francisca Antunes', 'Gisele Dantas', 'Ivone Esteves', 'Josiane Calixto', 'Luciana Lobato',
  'Marta Vargas', 'Nair Veloso', 'Rosana Bentes', 'Selma Jardim', 'Tereza Moraes',
  'Veronica Amorim', 'Andreia Braz', 'Catia Dutra', 'Dirce Taveira', 'Edilene Farias',
  'Fabienne Bastos', 'Gertrude Couto', 'Hortencia Serra', 'Iracema Vale', 'Josefa Luz',
  'Keila Avila', 'Lucia Galvao', 'Madalena Saldanha', 'Nilza Cabral', 'Odila Viana',
  'Perpetua Lago', 'Raimunda Bento', 'Solange Marques', 'Teresinha Lobo', 'Vania Cruz',
  'Wilma Florencio', 'Zenaide Porto', 'Anita Carneiro', 'Cleide Miranda', 'Eloisa Trindade',
  'Filomena Gomes', 'Graziela Herrera', 'Ilma Santana', 'Julieta Feitosa', 'Leonor Chagas',
  'Magnolia Simoes', 'Norma Rabelo', 'Otilia Bandeira', 'Piedade Fontenelle', 'Quiteria Lucena',
  'Rosa Verissimo', 'Sueli Castilho', 'Tania Branco', 'Ursulina Fagundes', 'Waleska Quirino',
];

const CEPS_RJ = [
  '22041', '22210', '22410', '22430', '22450', '22620', '22790', '20510',
  '20520', '20910', '21310', '21510', '21610', '21710', '23500', '24020',
];

function randomDate(startYear: number, endYear: number): string {
  const y = startYear + Math.floor(Math.random() * (endYear - startYear));
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function randomCpf(): string {
  const n = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
  return n;
}

function randomPhone(): string {
  const ddd = ['21', '22', '11', '31'][Math.floor(Math.random() * 4)];
  const num = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  return `${ddd}${num}`;
}

interface PatientSeed {
  id: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  zipCode: string;
  bloodType: string;
  height: number;
  category: string;
}

export function generatePatients(): PatientSeed[] {
  const patients: PatientSeed[] = [];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  for (let i = 0; i < 140; i++) {
    let category: string;
    if (i < 25) category = 'obs_baixo_risco';
    else if (i < 35) category = 'obs_fator_risco';
    else if (i < 60) category = 'obs_patologia';
    else if (i < 70) category = 'puerpera';
    else if (i < 90) category = 'ginecologica';
    else if (i < 110) category = 'menstrual';
    else if (i < 115) category = 'infertilidade';
    else if (i < 120) category = 'reproducao_assistida';
    else category = 'clinica_geral';

    const name = NOMES[i % NOMES.length];
    const emailBase = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.') + i;

    patients.push({
      id: randomUUID(),
      fullName: name,
      cpf: randomCpf(),
      email: `${emailBase}@teste.eliahealth.com`,
      phone: randomPhone(),
      dateOfBirth: category.startsWith('obs') || category === 'puerpera'
        ? randomDate(1990, 2002) // gestantes 24-36 anos
        : category === 'menstrual' ? randomDate(1988, 2006) // menstrual 20-38
        : category === 'infertilidade' || category === 'reproducao_assistida' ? randomDate(1985, 1995) // infertilidade 31-41
        : randomDate(1960, 2000), // clinica geral 26-66
      zipCode: CEPS_RJ[Math.floor(Math.random() * CEPS_RJ.length)] + String(Math.floor(Math.random() * 999)).padStart(3, '0'),
      bloodType: bloodTypes[Math.floor(Math.random() * bloodTypes.length)],
      height: 150 + Math.floor(Math.random() * 25),
      category,
    });
  }

  return patients;
}

/**
 * Gera SQL INSERT para todas as 140 pacientes.
 * Para usar: node -e "require('./dist/seeds/seed-test-patients').printSQL()"
 */
export function generateSQL(doctorId: string): string {
  const patients = generatePatients();
  const lines: string[] = [];

  // Insert patients
  for (const p of patients) {
    lines.push(`INSERT INTO patients (id, full_name, cpf, email, phone, date_of_birth, zip_code, blood_type, height, created_at, updated_at) VALUES ('${p.id}', '${p.fullName}', '${p.cpf}', '${p.email}', '${p.phone}', '${p.dateOfBirth}', '${p.zipCode}', '${p.bloodType}', ${p.height}, NOW(), NOW()) ON CONFLICT (cpf) DO NOTHING;`);
  }

  // Pregnancies for obstetric patients (categories: obs_baixo_risco, obs_fator_risco, obs_patologia)
  const obsPatients = patients.filter((p) => p.category.startsWith('obs'));
  for (const p of obsPatients) {
    const pregId = randomUUID();
    const gaWeeks = p.category === 'obs_baixo_risco' ? 20 + Math.floor(Math.random() * 16) // 20-36 semanas
      : p.category === 'obs_fator_risco' ? 16 + Math.floor(Math.random() * 20) // 16-36
      : 24 + Math.floor(Math.random() * 12); // 24-36 patologicas
    const lmpDate = new Date();
    lmpDate.setDate(lmpDate.getDate() - gaWeeks * 7);
    const edd = new Date(lmpDate);
    edd.setDate(edd.getDate() + 280);
    const isHighRisk = p.category !== 'obs_baixo_risco';
    const highRiskFlags = p.category === 'obs_patologia'
      ? (Math.random() > 0.5 ? "'{\"preeclampsia\",\"hipertensao\"}'" : "'{\"diabetes\",\"dmg\"}'")
      : p.category === 'obs_fator_risco'
      ? "'{\"idade_materna\"}'"
      : "'{}'";

    lines.push(`INSERT INTO pregnancies (id, patient_id, lmp_date, edd, ga_method, status, is_high_risk, high_risk_flags, gravida, para, abortus, created_at, updated_at) VALUES ('${pregId}', '${p.id}', '${lmpDate.toISOString().split('T')[0]}', '${edd.toISOString().split('T')[0]}', 'lmp', 'active', ${isHighRisk}, ${highRiskFlags}, ${1 + Math.floor(Math.random() * 3)}, ${Math.floor(Math.random() * 2)}, ${Math.floor(Math.random() * 1)}, NOW(), NOW()) ON CONFLICT DO NOTHING;`);

    // Consultations (2-5 per pregnancy)
    const numConsults = 2 + Math.floor(Math.random() * 4);
    for (let c = 0; c < numConsults; c++) {
      const consultDate = new Date(lmpDate);
      consultDate.setDate(consultDate.getDate() + (12 + c * 4) * 7);
      const gaDays = (12 + c * 4) * 7;
      const bpSys = p.category === 'obs_patologia' && Math.random() > 0.4 ? 140 + Math.floor(Math.random() * 30) : 110 + Math.floor(Math.random() * 20);
      const bpDia = p.category === 'obs_patologia' && Math.random() > 0.4 ? 90 + Math.floor(Math.random() * 20) : 60 + Math.floor(Math.random() * 20);
      const weight = 55 + Math.floor(Math.random() * 25) + c * 1.5;

      lines.push(`INSERT INTO consultations (id, pregnancy_id, date, gestational_age_days, weight_kg, bp_systolic, bp_diastolic, fetal_heart_rate, fundal_height_cm, created_at, updated_at) VALUES ('${randomUUID()}', '${pregId}', '${consultDate.toISOString().split('T')[0]}', ${gaDays}, ${weight.toFixed(1)}, ${bpSys}, ${bpDia}, ${120 + Math.floor(Math.random() * 40)}, ${Math.floor(gaDays / 7)}, NOW(), NOW()) ON CONFLICT DO NOTHING;`);
    }

    // BP readings for patologia patients
    if (p.category === 'obs_patologia') {
      for (let b = 0; b < 8; b++) {
        const bpDate = new Date();
        bpDate.setDate(bpDate.getDate() - b * 3);
        const sys = 130 + Math.floor(Math.random() * 30);
        const dia = 80 + Math.floor(Math.random() * 20);
        lines.push(`INSERT INTO bp_readings (id, pregnancy_id, reading_date, reading_time, reading_date_time, systolic, diastolic, gestational_age_days, status, source, created_at, updated_at) VALUES ('${randomUUID()}', '${pregId}', '${bpDate.toISOString().split('T')[0]}', '08:00:00', '${bpDate.toISOString()}', ${sys}, ${dia}, ${gaWeeks * 7 - b * 3}, '${sys >= 140 ? 'attention' : 'normal'}', 'physician', NOW(), NOW()) ON CONFLICT DO NOTHING;`);
      }

      // Glucose readings for DMG patients
      if (Math.random() > 0.5) {
        for (let g = 0; g < 10; g++) {
          const gDate = new Date();
          gDate.setDate(gDate.getDate() - g * 2);
          const gVal = 85 + Math.floor(Math.random() * 40);
          lines.push(`INSERT INTO glucose_readings (id, pregnancy_id, reading_date, reading_time, reading_date_time, measurement_type, glucose_value, status, source, created_at, updated_at) VALUES ('${randomUUID()}', '${pregId}', '${gDate.toISOString().split('T')[0]}', '07:00:00', '${gDate.toISOString()}', 'fasting', ${gVal}, '${gVal > 95 ? 'attention' : 'normal'}', 'physician', NOW(), NOW()) ON CONFLICT DO NOTHING;`);
        }
      }
    }
  }

  return lines.join('\n');
}

// Export for direct usage
export default { generatePatients, generateSQL };
