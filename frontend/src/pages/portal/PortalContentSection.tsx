import { useQuery } from '@tanstack/react-query';
import { BookOpen, Play, CheckSquare, HelpCircle } from 'lucide-react';
import { fetchPatientContent, CATEGORY_LABELS } from '../../api/content.api';
import { cn } from '../../utils/cn';

interface Props { gaWeek?: number }

const TYPE_ICONS: Record<string, React.ElementType> = {
  article: BookOpen, video: Play, checklist: CheckSquare, faq: HelpCircle,
};

export default function PortalContentSection({ gaWeek }: Props) {
  const { data: content } = useQuery({
    queryKey: ['portal-content', gaWeek],
    queryFn: () => fetchPatientContent(gaWeek),
  });

  const items = Array.isArray(content) ? content : [];
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-lilac" />
        <h3 className="text-sm font-semibold text-navy">Para você</h3>
      </div>
      <div className="space-y-2">
        {items.slice(0, 5).map((c) => {
          const Icon = TYPE_ICONS[c.contentType] ?? BookOpen;
          return (
            <div key={c.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-lilac/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-lilac" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-navy">{c.title}</p>
                {c.summary && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{c.summary}</p>}
                {c.category && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-lilac/10 text-lilac text-[9px] font-medium rounded-full">
                    {CATEGORY_LABELS[c.category] ?? c.category}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
