import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Plus, ChevronDown, ChevronUp, Send, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { fetchBillingRecords, fetchBillingSummary, submitBilling, markBillingPaid, denyBilling, STATUS_LABELS, STATUS_COLORS } from '../../api/billing.api';
import { cn } from '../../utils/cn';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Stat } from '../../components/ui/Stat';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';

function fmtCurrency(v: number | string) { return `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`; }
function fmtDate(d: any) { if (!d) return '—'; try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return '—'; } }

export default function BillingPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: summary } = useQuery({ queryKey: ['billing-summary'], queryFn: fetchBillingSummary });
  const { data: records } = useQuery({ queryKey: ['billing-records', status], queryFn: () => fetchBillingRecords(status || undefined) });

  const submitMut = useMutation({
    mutationFn: submitBilling,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['billing'] }); toast.success('Guia enviada'); },
  });
  const paidMut = useMutation({
    mutationFn: ({ id, value }: { id: string; value: number }) => markBillingPaid(id, value),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['billing'] }); toast.success('Pagamento registrado'); },
  });

  const items = records?.data ?? [];
  const s = summary ?? {};

  const tabs = [
    { key: '', label: 'Todas', count: s.total },
    { key: 'draft', label: 'Rascunhos', count: s.drafts },
    { key: 'submitted', label: 'Enviadas', count: s.submitted },
    { key: 'denied', label: 'Glosadas', count: s.denied },
    { key: 'paid', label: 'Pagas', count: s.paid },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Faturamento</h1>
          <p className="text-sm text-gray-500">Guias TISS e faturamento de convenios</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={<DollarSign className="w-5 h-5" />} label="Total faturado" value={fmtCurrency(s.total_billed ?? 0)} color="bg-lilac/10 text-lilac" />
        <Stat icon={<Check className="w-5 h-5" />} label="Total recebido" value={fmtCurrency(s.total_received ?? 0)} color="bg-emerald-50 text-emerald-600" />
        <Stat icon={<X className="w-5 h-5" />} label="Total glosado" value={fmtCurrency(s.total_denied ?? 0)} color="bg-red-50 text-red-600" />
        <Stat icon={<Send className="w-5 h-5" />} label="Pendentes" value={String(s.submitted ?? 0)} color="bg-blue-50 text-blue-600" />
      </div>

      <Card padding="none">
        <Tabs tabs={tabs} active={status} onChange={setStatus} />

        {items.length === 0 ? (
          <EmptyState icon={<DollarSign className="w-12 h-12" />} title="Nenhum registro" />
        ) : (
          <div className="divide-y">
            {items.map((r: any) => {
              const isExp = expandedId === r.id;
              return (
                <div key={r.id}>
                  <button onClick={() => setExpandedId(isExp ? null : r.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-navy">{fmtDate(r.serviceDate ?? r.service_date)}</span>
                      <span className="text-xs text-gray-500">{r.patient?.fullName ?? '—'}</span>
                      <span className="text-xs text-gray-400">{r.insuranceProvider ?? r.insurance_provider ?? 'Particular'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-navy">{fmtCurrency(r.totalValue ?? r.total_value)}</span>
                      <Badge className={STATUS_COLORS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                      {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>
                  {isExp && (
                    <div className="border-t px-5 py-4 space-y-3">
                      {r.procedures?.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs border-b border-gray-100 pb-1">
                          <span className="text-gray-700">{p.tussCode} — {p.description}</span>
                          <span className="text-gray-600">{p.quantity}x {fmtCurrency(p.unitValue)} = {fmtCurrency(p.totalValue)}</span>
                        </div>
                      ))}
                      {r.denialReason && <p className="text-xs text-red-600">Glosa: {r.denialReason}</p>}
                      <div className="flex gap-2 pt-2">
                        {r.status === 'draft' && (
                          <Button size="sm" variant="primary" icon={<Send className="w-3.5 h-3.5" />} onClick={() => submitMut.mutate(r.id)}>Enviar</Button>
                        )}
                        {(r.status === 'submitted' || r.status === 'approved') && (
                          <Button size="sm" variant="success" icon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => paidMut.mutate({ id: r.id, value: r.totalValue ?? r.total_value })}>Marcar pago</Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
