import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pill,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  Star,
  Pencil,
} from 'lucide-react';
import {
  fetchContraceptionRecords,
  fetchCurrentContraception,
  deleteContraceptionRecord,
  METHOD_LABELS,
  DESIRE_LABELS,
  type ContraceptionRecord,
  type ContraceptionAlert,
} from '../../../api/contraception-records.api';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/formatters';
import NewContraceptionRecordModal from './NewContraceptionRecordModal';
import { DeleteButton } from '../../../components/forms/DeleteButton';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}

export default function ContraceptionSection({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContraceptionRecord | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contraception-records', patientId],
    queryFn: () => fetchContraceptionRecords(patientId),
    enabled: !!patientId,
  });

  const { data: current } = useQuery({
    queryKey: ['contraception-records', patientId, 'current'],
    queryFn: () => fetchCurrentContraception(patientId),
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContraceptionRecord(patientId, id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ['contraception-records', patientId] });
    },
  });

  const items = data?.data ?? [];

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };
  const openEdit = (it: ContraceptionRecord) => {
    setEditingItem(it);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-navy">Contracepção</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Histórico de métodos e desejo reprodutivo (OMS MEC 2015)
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" />
          Nova consulta
        </button>
      </div>

      {/* Card de método atual em destaque */}
      {current && (
        <div className="mb-4 p-4 bg-lilac/5 border-2 border-lilac/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-lilac shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-lilac uppercase">Método atual</p>
              <p className="text-base font-semibold text-navy mt-0.5">
                {METHOD_LABELS[current.currentMethod]}
              </p>
              {current.currentMethodDetails && (
                <p className="text-sm text-gray-600 mt-1">{current.currentMethodDetails}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Desejo reprodutivo: {DESIRE_LABELS[current.desireForPregnancy]}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <Pill className="w-10 h-10 mb-3" />
          <p className="font-medium">Nenhuma consulta de contracepção</p>
          <p className="text-sm mt-1">Clique em "Nova consulta" para registrar a primeira</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card
              key={it.id}
              item={it}
              expanded={expandedId === it.id}
              onToggle={() => setExpandedId(expandedId === it.id ? null : it.id)}
              onEdit={() => openEdit(it)}
              onDelete={() => deleteMutation.mutate(it.id)}
              isDeleting={deletingId === it.id}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <NewContraceptionRecordModal
          patientId={patientId}
          record={editingItem ?? undefined}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function Card({
  item: c,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
}: {
  item: ContraceptionRecord;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const alerts = c.alerts ?? [];
  const urgentCount = alerts.filter((a) => a.severity === 'urgent').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;
  const prescribed = c.methodPrescribed ?? c.currentMethod;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-lilac/50 transition">
      <div className="flex items-center gap-2 p-4 hover:bg-gray-50 transition">
        <button
          onClick={onToggle}
          className="flex items-center gap-4 flex-1 text-left min-w-0"
        >
          <div className="w-10 h-10 rounded-lg bg-lilac/10 text-lilac flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800">{formatDate(c.consultationDate)}</span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {METHOD_LABELS[prescribed]}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {DESIRE_LABELS[c.desireForPregnancy]}
              {c.breastfeeding && ' · Amamentando'}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {urgentCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded">
              <AlertTriangle className="w-3 h-3" />
              {urgentCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded">
              <AlertCircle className="w-3 h-3" />
              {warningCount}
            </span>
          )}
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-lilac hover:bg-lilac/5 rounded transition"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <DeleteButton
            onConfirm={onDelete}
            isPending={isDeleting}
            label="Excluir consulta"
            confirmLabel="Excluir esta consulta?"
          />
          <button
            onClick={onToggle}
            className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded transition"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-gray-50/50 space-y-4">
          {(c.iudInsertionDate || c.implantInsertionDate) && (
            <div className="grid grid-cols-2 gap-3">
              {c.iudInsertionDate && (
                <Info_Card
                  label="DIU inserido em"
                  value={formatDate(c.iudInsertionDate)}
                  sub={c.iudExpirationDate ? `Vence ${formatDate(c.iudExpirationDate)}` : undefined}
                />
              )}
              {c.implantInsertionDate && (
                <Info_Card
                  label="Implante inserido em"
                  value={formatDate(c.implantInsertionDate)}
                  sub={
                    c.implantExpirationDate
                      ? `Vence ${formatDate(c.implantExpirationDate)}`
                      : undefined
                  }
                />
              )}
            </div>
          )}

          {c.methodPrescribedDetails && (
            <Block label="Detalhes do método">{c.methodPrescribedDetails}</Block>
          )}
          {c.notes && <Block label="Observações">{c.notes}</Block>}

          {alerts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Alertas do copiloto
              </p>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <AlertItem key={i} alert={a} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info_Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded p-2.5 border border-gray-100">
      <p className="text-[10px] font-semibold text-gray-400 uppercase">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{children}</p>
    </div>
  );
}

function AlertItem({ alert }: { alert: ContraceptionAlert }) {
  const styles = {
    urgent: { Icon: AlertTriangle, cls: 'bg-red-50 border-red-200 text-red-700' },
    warning: { Icon: AlertCircle, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
    info: { Icon: Info, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
  };
  const s = styles[alert.severity];
  return (
    <div className={cn('flex items-start gap-2 p-2.5 rounded-lg border text-sm', s.cls)}>
      <s.Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{alert.message}</span>
    </div>
  );
}
