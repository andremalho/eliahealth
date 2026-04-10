import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Sparkles, Send, Loader2, Clock, BarChart3 } from 'lucide-react';
import { queryResearch, fetchQueryHistory } from '../../api/research.api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '../../utils/cn';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed', '#4f46e5'];

export default function AiQueryPanel() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: history } = useQuery({
    queryKey: ['query-history'],
    queryFn: fetchQueryHistory,
    enabled: showHistory,
  });

  const mutation = useMutation({
    mutationFn: (q: string) => queryResearch(q),
    onSuccess: (data) => setResult(data),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    mutation.mutate(question);
  };

  const historyItems = Array.isArray(history) ? history : [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-lilac" />
            <h3 className="font-semibold text-navy">Pergunte aos seus dados</h3>
          </div>
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-lilac">
            <Clock className="w-3.5 h-3.5" /> Historico
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Faca perguntas em linguagem natural sobre seus dados anonimizados</p>
      </div>

      <div className="p-5">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Qual a taxa de cesarea por faixa etaria?"
            className="flex-1 px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
            disabled={mutation.isPending}
          />
          <button type="submit" disabled={mutation.isPending || !question.trim()}
            className="px-4 py-2.5 bg-lilac text-white rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center gap-2">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-4 space-y-3">
            {result.explanation && (
              <div className="p-4 bg-lilac/5 rounded-lg">
                <p className="text-sm text-gray-700">{result.explanation}</p>
              </div>
            )}

            {result.error && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">{result.error}</p>
              </div>
            )}

            {result.data && result.data.length > 0 && (
              <div className="h-64">
                {result.chartType === 'pie' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={result.data} cx="50%" cy="50%" outerRadius={90} dataKey={Object.keys(result.data[0]).find((k) => typeof result.data[0][k] === 'number') ?? 'value'} nameKey={Object.keys(result.data[0]).find((k) => typeof result.data[0][k] === 'string') ?? 'name'} label>
                        {result.data.map((_: any, i: number) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.data}>
                      <XAxis dataKey={Object.keys(result.data[0]).find((k) => typeof result.data[0][k] === 'string') ?? 'name'} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey={Object.keys(result.data[0]).find((k) => typeof result.data[0][k] === 'number') ?? 'value'} fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {result.data && result.data.length > 0 && (
              <details className="text-xs text-gray-400">
                <summary className="cursor-pointer hover:text-gray-600">Ver dados brutos ({result.data.length} registos)</summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded-lg overflow-x-auto text-[10px]">{JSON.stringify(result.data, null, 2)}</pre>
              </details>
            )}
          </div>
        )}

        {/* History */}
        {showHistory && historyItems.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Perguntas recentes</p>
            <div className="space-y-1">
              {historyItems.slice(0, 8).map((h: any, i: number) => (
                <button key={i} onClick={() => { setQuestion(h.question); setShowHistory(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded truncate">
                  {h.question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
