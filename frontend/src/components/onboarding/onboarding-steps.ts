export interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const DOCTOR_MAIN_FLOW: OnboardingStep[] = [
  {
    id: 'welcome',
    target: '#dashboard-header',
    title: 'Bem-vindo ao EliaHealth',
    content: 'Este e seu painel de controle. Aqui você ve tudo que precisa de atenção: pacientes, alertas, resumos pendentes. Vou te mostrar as novidades em 60 segundos.',
    position: 'bottom',
  },
  {
    id: 'urgent-actions',
    target: '#urgent-actions-bar',
    title: 'Ações urgentes',
    content: 'Quando algo precisa da sua atenção imediata — como uma paciente que relatou sangramento no chat — aparece aqui em destaque.',
    position: 'bottom',
  },
  {
    id: 'copilot-overview',
    target: '#copilot-overview-card',
    title: 'Seu Copiloto Clínico',
    content: 'Durante a consulta, o copiloto analisa os dados em tempo real e sugere o que pode estar faltando. Ao finalizar, gera um checklist de validação baseado em guidelines (FEBRASGO, ACOG).',
    position: 'top',
  },
  {
    id: 'pending-summaries',
    target: '#pending-summaries-card',
    title: 'Resumos para a paciente',
    content: 'Após cada consulta, o sistema gera um resumo em linguagem simples para a paciente. Você revisa e aprova antes do envio. A paciente recebe no WhatsApp e no portal.',
    position: 'left',
  },
  {
    id: 'patient-attention',
    target: '#patient-attention-card',
    title: 'Pacientes que precisam de você',
    content: 'O sistema monitora automaticamente: quem não retornou no prazo, quais exames estao pendentes, e se alguma paciente relatou urgência no chat.',
    position: 'top',
  },
  {
    id: 'finish',
    target: '#dashboard-header',
    title: 'Tudo pronto!',
    content: 'Você pode começar a atender. O copiloto aparece automaticamente quando abrir uma consulta. Clique no "?" no canto superior direito para rever este tour.',
    position: 'bottom',
  },
];

export const COPILOT_CONSULTATION_FLOW: OnboardingStep[] = [
  {
    id: 'copilot-panel',
    target: '#copilot-side-panel',
    title: 'Painel do Copiloto',
    content: 'Enquanto você preenche a consulta, insights aparecem aqui. Não interrompe seu fluxo — olhe quando quiser.',
    position: 'left',
  },
  {
    id: 'copilot-checklist',
    target: '#finalize-consultation-button',
    title: 'Checklist ao finalizar',
    content: 'Quando finalizar a consulta, aparece um checklist de validação. Itens vermelhos precisam de resolução. E sua rede de seguranca clínica.',
    position: 'top',
  },
];

export function getStepsByFlow(flowName: string): OnboardingStep[] {
  switch (flowName) {
    case 'doctor_main': return DOCTOR_MAIN_FLOW;
    case 'copilot_consultation': return COPILOT_CONSULTATION_FLOW;
    default: return [];
  }
}
