import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  setDoctorSchedule, getDoctorSchedule, blockDate, getBlockedDates, unblockDate, DAY_LABELS,
} from '../../api/scheduling.api';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../utils/cn';

const TIMES = Array.from({ length: 25 }, (_, i) => {
  const h = 7 + Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
}).filter((t) => t <= '20:00');

export default function DoctorScheduleSettings() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const userId = (user as any)?.userId ?? '';

  const [schedules, setSchedules] = useState<{ dayOfWeek: number; startTime: string; endTime: string; slotDurationMin: number }[]>([]);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [loaded, setLoaded] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ['doctor-schedule', userId],
    queryFn: () => getDoctorSchedule(userId),
    enabled: !!userId,
  });

  const { data: blocked } = useQuery({
    queryKey: ['blocked-dates', userId],
    queryFn: () => getBlockedDates(userId),
    enabled: !!userId,
  });

  // Init from existing
  if (existing && !loaded && Array.isArray(existing) && existing.length > 0) {
    setSchedules(existing.map((s: any) => ({
      dayOfWeek: s.dayOfWeek ?? s.day_of_week,
      startTime: s.startTime ?? s.start_time,
      endTime: s.endTime ?? s.end_time,
      slotDurationMin: s.slotDurationMin ?? s.slot_duration_min ?? 30,
    })));
    setLoaded(true);
  }

  const saveMut = useMutation({
    mutationFn: () => setDoctorSchedule(schedules),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-schedule'] });
      toast.success('Grade horaria salva');
    },
  });

  const blockMut = useMutation({
    mutationFn: () => blockDate(newBlockDate, blockReason || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast.success('Data bloqueada');
      setNewBlockDate('');
      setBlockReason('');
    },
  });

  const unblockMut = useMutation({
    mutationFn: unblockDate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast.success('Data desbloqueada');
    },
  });

  const addDay = () => {
    const usedDays = schedules.map((s) => s.dayOfWeek);
    const nextDay = [1, 2, 3, 4, 5, 6, 0].find((d) => !usedDays.includes(d));
    if (nextDay == null) return;
    setSchedules([...schedules, { dayOfWeek: nextDay, startTime: '08:00', endTime: '18:00', slotDurationMin: 30 }]);
  };

  const removeDay = (idx: number) => setSchedules(schedules.filter((_, i) => i !== idx));

  const updateDay = (idx: number, field: string, value: any) => {
    const copy = [...schedules];
    (copy[idx] as any)[field] = value;
    setSchedules(copy);
  };

  const blockedList = Array.isArray(blocked) ? blocked : [];

  return (
    <div className="space-y-6">
      {/* Weekly schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-navy">Grade Horaria Semanal</h3>
          <button onClick={addDay} disabled={schedules.length >= 7}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-lilac text-white rounded-lg hover:bg-primary-dark disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> Adicionar dia
          </button>
        </div>

        {schedules.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Nenhum dia configurado. Adicione dias para habilitar agendamento.</p>
        ) : (
          <div className="space-y-2">
            {schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <select value={s.dayOfWeek} onChange={(e) => updateDay(i, 'dayOfWeek', Number(e.target.value))}
                  className="px-2 py-1.5 border rounded text-sm w-28">
                  {DAY_LABELS.map((l, d) => <option key={d} value={d}>{l}</option>)}
                </select>
                <select value={s.startTime} onChange={(e) => updateDay(i, 'startTime', e.target.value)}
                  className="px-2 py-1.5 border rounded text-sm">
                  {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-xs text-gray-400">ate</span>
                <select value={s.endTime} onChange={(e) => updateDay(i, 'endTime', e.target.value)}
                  className="px-2 py-1.5 border rounded text-sm">
                  {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={s.slotDurationMin} onChange={(e) => updateDay(i, 'slotDurationMin', Number(e.target.value))}
                  className="px-2 py-1.5 border rounded text-sm">
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
                <button onClick={() => removeDay(i)} className="p-1.5 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
          className="mt-3 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center gap-2">
          {saveMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Salvar grade
        </button>
      </div>

      {/* Blocked dates */}
      <div>
        <h3 className="text-sm font-semibold text-navy mb-3">Datas Bloqueadas (folgas, feriados)</h3>
        <div className="flex gap-2 mb-3">
          <input type="date" value={newBlockDate} onChange={(e) => setNewBlockDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Motivo (opcional)" className="px-3 py-2 border rounded-lg text-sm flex-1" />
          <button onClick={() => blockMut.mutate()} disabled={!newBlockDate || blockMut.isPending}
            className="px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100 disabled:opacity-50">
            Bloquear
          </button>
        </div>

        {blockedList.length > 0 && (
          <div className="space-y-1">
            {blockedList.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between px-3 py-2 bg-red-50/50 rounded-lg text-xs">
                <span className="text-gray-700">
                  {new Date((b.blockedDate ?? b.blocked_date) + 'T12:00:00').toLocaleDateString('pt-BR')}
                  {b.reason && <span className="text-gray-400 ml-2">— {b.reason}</span>}
                </span>
                <button onClick={() => unblockMut.mutate(b.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
