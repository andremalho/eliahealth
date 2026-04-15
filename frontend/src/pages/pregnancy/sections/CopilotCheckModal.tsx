import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, AlertTriangle, XCircle, Loader2, ChevronDown, ChevronUp,
  Shield, Clock,
} from 'lucide-react';
import {
  generatePostConsultationCheck,
  resolveCheckItem,
  markCheckAsReviewed,
  CopilotCheck,
  CopilotCheckItem,
} from '../../../api/clinical-copilot.api';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

interface Props {
  consultationId: string;
  onClose: () => void;
  onReviewComplete: () => void;
}

const SEVERITY_CONFIG = {
  action_required: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Acao recomendada' },
  attention: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Atencao' },
  ok: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'OK' },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  exam: 'Exame',
  prescription: 'Prescricao',
  screening: 'Rastreio',
  vaccine: 'Vacina',
  referral: 'Encaminhamento',
  monitoring: 'Monitoramento',
  follow_up: 'Acompanhamento',
  anamnesis_gap: 'Anamnese',
  drug_interaction: 'Interacao medicamentosa',
  contraindication: 'Contraindicacao',
};

const RESOLUTION_OPTIONS = [
  { value: 'accepted', label: 'Aceitar sugestao', emoji: '✅' },
  { value: 'already_done', label: 'Ja foi feito', emoji: '✔️' },
  { value: 'deferred', label: 'Adiar para proxima', emoji: '⏳' },
  { value: 'ignored', label: 'Ignorar', emoji: '🚫' },
];

export default function CopilotCheckModal({ consultationId, onClose, onReviewComplete }: Props) {
  const qc = useQueryClient();
  const [check, setCheck] = useState<CopilotCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [ignoreNote, setIgnoreNote] = useState('');
  const [resolvingItem, setResolvingItem] = useState<string | null>(null);

  // Generate check on mount
  useEffect(() => {
    generatePostConsultationCheck(consultationId)
      .then((result) => { setCheck(result); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [consultationId]);

  const resolveMut = useMutation({
    mutationFn: (params: { itemId: string; resolution: string; note?: string }) =>
      resolveCheckItem(params.itemId, { resolution: params.resolution, resolutionNote: params.note }),
    onSuccess: (updated) => {
      if (!check) return;
      setCheck({
        ...check,
        items: check.items.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)),
      });
      setResolvingItem(null);
      setIgnoreNote('');
      setExpandedItem(null);
    },
  });

  const reviewMut = useMutation({
    mutationFn: () => markCheckAsReviewed(check!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] });
      onReviewComplete();
    },
  });

  const unresolvedActionRequired = check?.items.filter(
    (i) => i.severity === 'action_required' && !i.resolution,
  ).length ?? 0;

  const canFinish = unresolvedActionRequired === 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Revisao pos-consulta"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Copiloto clinico EliaHealth
            {check?.generationTimeMs && (
              <span className="ml-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {(check.generationTimeMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Fechar</Button>
            <Button
              onClick={() => reviewMut.mutate()}
              loading={reviewMut.isPending}
              disabled={!canFinish}
              title={!canFinish ? `${unresolvedActionRequired} item(ns) obrigatorio(s) pendente(s)` : ''}
            >
              Finalizar consulta
            </Button>
          </div>
        </div>
      }
    >
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-lilac animate-spin" />
          <p className="text-sm text-gray-600">Analisando conduta clinica...</p>
          <p className="text-xs text-gray-400">Baseado em guidelines FEBRASGO, ACOG, NICE</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-sm text-red-600 mb-2">Falha ao gerar checklist</p>
          <p className="text-xs text-gray-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={onClose}>
            Continuar sem checklist
          </Button>
        </div>
      )}

      {check && !loading && (
        <div className="space-y-2">
          {/* Summary badges */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            {check.actionRequiredCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full">
                <XCircle className="w-3 h-3" /> {check.actionRequiredCount} acao
              </span>
            )}
            {check.attentionCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" /> {check.attentionCount} atencao
              </span>
            )}
            {check.okCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> {check.okCount} ok
              </span>
            )}
          </div>

          {/* Items */}
          {check.items.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              Nenhuma recomendacao gerada para esta consulta.
            </div>
          ) : (
            check.items.map((item) => (
              <CheckItemCard
                key={item.id}
                item={item}
                expanded={expandedItem === item.id}
                onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                onResolve={(resolution, note) => {
                  resolveMut.mutate({ itemId: item.id, resolution, note });
                }}
                resolving={resolveMut.isPending && resolvingItem === item.id}
                ignoreNote={ignoreNote}
                onIgnoreNoteChange={setIgnoreNote}
              />
            ))
          )}
        </div>
      )}
    </Modal>
  );
}

function CheckItemCard({
  item,
  expanded,
  onToggle,
  onResolve,
  resolving,
  ignoreNote,
  onIgnoreNoteChange,
}: {
  item: CopilotCheckItem;
  expanded: boolean;
  onToggle: () => void;
  onResolve: (resolution: string, note?: string) => void;
  resolving: boolean;
  ignoreNote: string;
  onIgnoreNoteChange: (v: string) => void;
}) {
  const config = SEVERITY_CONFIG[item.severity];
  const Icon = config.icon;
  const isResolved = !!item.resolution;
  const [showIgnoreInput, setShowIgnoreInput] = useState(false);

  return (
    <div className={cn('border rounded-lg overflow-hidden', isResolved ? 'border-gray-200 opacity-70' : config.border)}>
      <button
        onClick={onToggle}
        className={cn('w-full flex items-start gap-3 p-3 text-left', config.bg)}
      >
        <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium', isResolved ? 'line-through text-gray-500' : 'text-navy')}>
              {item.title}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-white/50 rounded text-gray-600">
              {CATEGORY_LABELS[item.category] ?? item.category}
            </span>
            {isResolved && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                {item.resolution === 'accepted' ? '✅ Aceito' : item.resolution === 'already_done' ? '✔️ Ja feito' : item.resolution === 'deferred' ? '⏳ Adiado' : '🚫 Ignorado'}
              </span>
            )}
          </div>
          {!expanded && (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{item.description}</p>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-gray-100">
          <p className="text-sm text-gray-700">{item.description}</p>

          {item.suggestedAction && (
            <div className="bg-blue-50 border border-blue-100 rounded p-2.5">
              <p className="text-xs font-medium text-blue-800 mb-0.5">Acao sugerida:</p>
              <p className="text-xs text-blue-700">{item.suggestedAction}</p>
            </div>
          )}

          {item.guidelineReference && (
            <p className="text-[10px] text-gray-500 italic">{item.guidelineReference}</p>
          )}

          {!isResolved && item.severity !== 'ok' && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
              {RESOLUTION_OPTIONS.map((opt) => {
                if (opt.value === 'ignored') {
                  return (
                    <div key={opt.value}>
                      {showIgnoreInput ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            placeholder="Justificativa obrigatoria..."
                            className="text-xs border border-gray-300 rounded px-2 py-1 flex-1 min-w-[200px]"
                            value={ignoreNote}
                            onChange={(e) => onIgnoreNoteChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && ignoreNote.trim()) {
                                onResolve('ignored', ignoreNote.trim());
                                setShowIgnoreInput(false);
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (ignoreNote.trim()) {
                                onResolve('ignored', ignoreNote.trim());
                                setShowIgnoreInput(false);
                              }
                            }}
                            disabled={!ignoreNote.trim()}
                            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setShowIgnoreInput(false)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowIgnoreInput(true)}
                          className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                        >
                          {opt.emoji} {opt.label}
                        </button>
                      )}
                    </div>
                  );
                }
                return (
                  <button
                    key={opt.value}
                    onClick={() => onResolve(opt.value)}
                    disabled={resolving}
                    className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    {opt.emoji} {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {isResolved && item.resolutionNote && (
            <p className="text-xs text-gray-500 italic">Nota: {item.resolutionNote}</p>
          )}
        </div>
      )}
    </div>
  );
}
