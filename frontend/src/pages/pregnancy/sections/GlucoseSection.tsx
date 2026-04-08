import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Droplets, Plus } from 'lucide-react';
import { fetchGlucoseSummary, fetchGlucoseDailyTable } from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';
import AddGlucoseReadingModal from './AddGlucoseReadingModal';

const COLS = ['fasting', 'post_breakfast_1h', 'post_lunch_1h', 'pre_dinner', 'post_dinner_1h'] as const;
const COL_LABELS: Record<string, string> = {
  fasting: 'Jejum', post_breakfast_1h: 'Pós café', post_lunch_1h: 'Pós almoço',
  pre_dinner: 'Antes jantar', post_dinner_1h: 'Pós jantar',
};
const THRESHOLDS: Record<string, number> = { fasting: 95 };
const DEFAULT_THRESHOLD = 140;

export default function GlucoseSection({ pregnancyId }: { pregnancyId: string }) {
  const [addOpen, setAddOpen] = useState(false);
  const { data: summary } = useQuery({
    queryKey: ['glucose-summary', pregnancyId],
    queryFn: () => fetchGlucoseSummary(pregnancyId),
  });

  const { data: table, isLoading } = useQuery({
    queryKey: ['glucose-table', pregnancyId],
    queryFn: () => fetchGlucoseDailyTable(pregnancyId),
  });

  const rows = Array.isArray(table) ? table : [];
  const total = summary?.totalReadings ?? 0;
  const altered = summary?.alteredPercentage ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-navy">Controle Glicêmico</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">{total} medições</span>
          {total > 0 && (
            <span className={cn('font-medium', altered > 0 ? 'text-red-600' : 'text-emerald-600')}>
              {altered}% alteradas
            </span>
          )}
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-lilac text-white text-xs rounded-lg hover:bg-primary-dark">
            <Plus className="w-3.5 h-3.5" /> Nova
          </button>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="h-32 animate-pulse bg-gray-100 rounded" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhuma medição registrada</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                <th className="px-3 py-2">Data</th>
                {COLS.map((c) => <th key={c} className="px-3 py-2 text-center">{COL_LABELS[c]}</th>)}
              </tr></thead>
              <tbody className="divide-y">
                {rows.slice(-7).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    {COLS.map((col) => {
                      const cell = row[col];
                      if (!cell) return <td key={col} className="px-3 py-2 text-center text-gray-300">—</td>;
                      const threshold = THRESHOLDS[col] ?? DEFAULT_THRESHOLD;
                      const isAltered = cell.value > threshold;
                      return (
                        <td key={col} className={cn('px-3 py-2 text-center font-medium', isAltered ? 'text-red-600 bg-red-50' : 'text-emerald-700')}>
                          {cell.value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {addOpen && <AddGlucoseReadingModal pregnancyId={pregnancyId} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
