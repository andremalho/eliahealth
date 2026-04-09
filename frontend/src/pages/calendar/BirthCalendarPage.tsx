import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, Baby } from 'lucide-react';
import { fetchUpcomingBirths } from '../../api/pregnancies.api';
import api from '../../api/client';
import { cn } from '../../utils/cn';

const MONTHS = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

async function fetchCalendar(month: number, year: number) {
  const { data } = await api.get('/birth-calendar', { params: { month, year } });
  return data as { pregnancyId: string; patientName: string; edd: string; gaWeeks: number; gaDays: number; daysUntilEdd: number }[];
}

export default function BirthCalendarPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: calendarData } = useQuery({
    queryKey: ['birth-calendar', month, year],
    queryFn: () => fetchCalendar(month, year),
  });

  const { data: upcoming } = useQuery({
    queryKey: ['upcoming-births-90'],
    queryFn: () => fetchUpcomingBirths(90),
  });

  const events = calendarData ?? [];
  const upcomingList = Array.isArray(upcoming) ? upcoming : [];

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const eventsByDay = new Map<number, typeof events>();
  for (const e of events) {
    const d = new Date(e.edd + 'T12:00:00');
    if (d.getMonth() + 1 === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push(e);
    }
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const todayDate = now.getDate();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6 text-lilac" />
        <h1 className="text-2xl font-semibold text-navy">Calendario de Partos</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
            <h2 className="text-lg font-semibold text-navy">{MONTHS[month - 1]} {year}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-500 uppercase py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const dayEvents = eventsByDay.get(day) ?? [];
                const isToday = isCurrentMonth && day === todayDate;

                return (
                  <div
                    key={i}
                    className={cn(
                      'min-h-[72px] p-1.5 rounded-lg border text-xs',
                      isToday ? 'border-lilac bg-lilac/5' : 'border-gray-100',
                      dayEvents.length > 0 && 'bg-blue-50/50',
                    )}
                  >
                    <span className={cn(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                      isToday ? 'bg-lilac text-white' : 'text-gray-700',
                    )}>
                      {day}
                    </span>
                    {dayEvents.slice(0, 2).map((e, j) => (
                      <div
                        key={j}
                        onClick={() => navigate(`/pregnancies/${e.pregnancyId}`)}
                        className="mt-0.5 px-1.5 py-0.5 bg-lilac/10 text-lilac text-[10px] font-medium rounded truncate cursor-pointer hover:bg-lilac/20"
                      >
                        {e.patientName.split(' ')[0]}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-gray-400 mt-0.5 block">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: upcoming */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold text-navy">Proximos partos</h3>
            <p className="text-xs text-gray-400 mt-0.5">Proximos 90 dias</p>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {upcomingList.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Nenhum parto previsto</div>
            ) : (
              upcomingList.map((b: any, i: number) => (
                <div
                  key={i}
                  onClick={() => navigate(`/pregnancies/${b.pregnancyId}`)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                    b.daysUntilEdd <= 7 ? 'bg-red-50 text-red-600' : b.daysUntilEdd <= 30 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600',
                  )}>
                    <Baby className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{b.patientName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(b.edd + 'T12:00:00').toLocaleDateString('pt-BR')} · {b.gaWeeks}s{b.gaDays}d
                    </p>
                  </div>
                  <span className={cn(
                    'text-xs font-semibold shrink-0',
                    b.daysUntilEdd <= 7 ? 'text-red-600' : b.daysUntilEdd <= 30 ? 'text-amber-600' : 'text-gray-500',
                  )}>
                    {b.daysUntilEdd}d
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
