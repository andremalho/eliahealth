import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send, Check, RefreshCw, AlertCircle, Eye, Edit3 } from 'lucide-react';
import {
  fetchSummariesByConsultation,
  approveSummary,
  sendSummary,
  generateSummary,
} from '../../../api/consultation-summaries.api';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

interface Props {
  consultationId: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  generating: { label: 'Gerando...', color: 'bg-amber-50 text-amber-700' },
  draft: { label: 'Rascunho', color: 'bg-blue-50 text-blue-700' },
  approved: { label: 'Aprovado', color: 'bg-emerald-50 text-emerald-700' },
  sent: { label: 'Enviado', color: 'bg-green-50 text-green-700' },
  delivered: { label: 'Entregue', color: 'bg-green-50 text-green-700' },
  read: { label: 'Lido pela paciente', color: 'bg-green-50 text-green-700' },
  failed: { label: 'Falhou', color: 'bg-red-50 text-red-700' },
};

export default function ConsultationSummaryPanel({ consultationId }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const { data: summaries, isLoading } = useQuery({
    queryKey: ['consultation-summaries', consultationId],
    queryFn: () => fetchSummariesByConsultation(consultationId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.length > 0 && data[0].status === 'generating') return 3000;
      return false;
    },
  });

  const approveMut = useMutation({
    mutationFn: (params: { id: string; text?: string }) =>
      approveSummary(params.id, { summaryText: params.text }),
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['consultation-summaries', consultationId] });
    },
  });

  const sendMut = useMutation({
    mutationFn: (id: string) => sendSummary(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultation-summaries', consultationId] });
    },
  });

  const regenerateMut = useMutation({
    mutationFn: () => generateSummary(consultationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultation-summaries', consultationId] });
    },
  });

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 mt-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando resumo...
        </div>
      </div>
    );
  }

  const summary = summaries?.[0];
  if (!summary) return null;

  const statusInfo = STATUS_LABELS[summary.status] ?? { label: summary.status, color: 'bg-gray-50 text-gray-700' };

  return (
    <div className="border border-gray-200 rounded-lg mt-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy">Resumo para a paciente</span>
          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', statusInfo.color)}>
            {statusInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(summary.status === 'failed' || summary.status === 'draft') && (
            <button
              onClick={() => regenerateMut.mutate()}
              disabled={regenerateMut.isPending}
              className="p-1.5 text-gray-400 hover:text-navy rounded"
              title="Regenerar"
            >
              <RefreshCw className={cn('w-4 h-4', regenerateMut.isPending && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {summary.status === 'generating' && (
          <div className="flex items-center gap-3 py-6 justify-center text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin text-lilac" />
            <span className="text-sm">A IA esta gerando o resumo...</span>
          </div>
        )}

        {summary.status === 'failed' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Falha ao gerar resumo. Clique em regenerar para tentar novamente.
          </div>
        )}

        {(summary.status === 'draft' || summary.status === 'approved' || summary.status === 'sent' || summary.status === 'delivered' || summary.status === 'read') && (
          <>
            {editing ? (
              <textarea
                className="w-full min-h-[200px] text-sm text-gray-700 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lilac/50 focus:border-lilac outline-none resize-y"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <div className="text-sm text-gray-700 whitespace-pre-line max-h-[300px] overflow-y-auto leading-relaxed">
                {summary.summaryText}
              </div>
            )}

            {/* Actions */}
            {summary.status === 'draft' && (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                {editing ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => { setEditing(false); setEditText(''); }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      loading={approveMut.isPending}
                      onClick={() => approveMut.mutate({ id: summary.id, text: editText })}
                    >
                      <Check className="w-4 h-4 mr-1" /> Aprovar com edições
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => { setEditing(true); setEditText(summary.summaryText); }}
                    >
                      <Edit3 className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button
                      loading={approveMut.isPending}
                      onClick={() => approveMut.mutate({ id: summary.id })}
                    >
                      <Check className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                  </>
                )}
              </div>
            )}

            {summary.status === 'approved' && (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <Button
                  loading={sendMut.isPending}
                  onClick={() => sendMut.mutate(summary.id)}
                >
                  <Send className="w-4 h-4 mr-1" /> Enviar para paciente
                </Button>
              </div>
            )}

            {(summary.status === 'sent' || summary.status === 'delivered' || summary.status === 'read') && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <Eye className="w-3 h-3" />
                Enviado em {new Date(summary.sentAt!).toLocaleDateString('pt-BR')}
                {summary.readAt && ` · Lido em ${new Date(summary.readAt).toLocaleDateString('pt-BR')}`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
