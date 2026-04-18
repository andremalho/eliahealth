import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import { Activity, TrendingUp, Table, AlertTriangle, Plus } from 'lucide-react';
import { fetchBpTimeline } from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';
import AddBpReadingModal from './AddBpReadingModal';

export default function BpSection({ pregnancyId }: { pregnancyId: string }) {
  const [mode, setMode] = useState<'chart' | 'table'>('chart');
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['bp-timeline', pregnancyId],
    queryFn: () => fetchBpTimeline(pregnancyId),
  });

  const readings = data?.readings ?? [];
  const refLines = data?.referenceLines ?? { hypertension: { systolic: 140, diastolic: 90 } };

  const chartData = readings.map((r: any) => ({
    date: new Date(r.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    systolic: r.systolic,
    diastolic: r.diastolic,
    altered: r.systolic >= 140 || r.diastolic >= 90,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-navy">Pressão Arterial</h3>
          <span className="text-xs text-gray-400">{readings.length} medições</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setMode('chart')} className={cn('p-1.5', mode === 'chart' ? 'bg-lilac text-white' : 'text-gray-400')}>
              <TrendingUp className="w-4 h-4" />
            </button>
            <button onClick={() => setMode('table')} className={cn('p-1.5', mode === 'table' ? 'bg-lilac text-white' : 'text-gray-400')}>
              <Table className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-lilac text-white text-xs rounded-lg hover:bg-primary-dark">
            <Plus className="w-3.5 h-3.5" /> Nova
          </button>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="h-48 animate-pulse bg-gray-100 rounded" />
        ) : readings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhuma medição registrada</p>
        ) : mode === 'chart' ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,22,31,0.08)" />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: 'rgba(20,22,31,0.55)' }} />
              <YAxis fontSize={10} tick={{ fill: 'rgba(20,22,31,0.55)' }} domain={[40, 200]} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={refLines.hypertension.systolic} stroke="#C9A977" strokeDasharray="5 5" label={{ value: '140', fontSize: 10, fill: '#7A5F2E', fontFamily: 'JetBrains Mono' }} />
              <ReferenceLine y={refLines.hypertension.diastolic} stroke="#C9A977" strokeDasharray="5 5" label={{ value: '90', fontSize: 10, fill: '#7A5F2E', fontFamily: 'JetBrains Mono' }} />
              <Line type="monotone" dataKey="systolic" stroke="#B85A3D" name="Sistólica" strokeWidth={1.5} dot={{ r: 3, fill: '#B85A3D' }} />
              <Line type="monotone" dataKey="diastolic" stroke="#14161F" name="Diastólica" strokeWidth={1.5} dot={{ r: 3, fill: '#14161F' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                <th className="px-3 py-2">Data/Hora</th><th className="px-3 py-2">Pressão</th><th className="px-3 py-2">Local</th><th className="px-3 py-2">Alerta</th>
              </tr></thead>
              <tbody className="divide-y">
                {readings.map((r: any, i: number) => {
                  const altered = r.systolic >= 140 || r.diastolic >= 90;
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{new Date(r.dateTime).toLocaleString('pt-BR')}</td>
                      <td className={cn('px-3 py-2 font-medium', altered && 'text-red-600')}>{r.systolic}/{r.diastolic}</td>
                      <td className="px-3 py-2 text-gray-500">{r.measurementLocation ?? '—'}</td>
                      <td className="px-3 py-2">{altered && <AlertTriangle className="w-4 h-4 text-red-500" />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {addOpen && <AddBpReadingModal pregnancyId={pregnancyId} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
