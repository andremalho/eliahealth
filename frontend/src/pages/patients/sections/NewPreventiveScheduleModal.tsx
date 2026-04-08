import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Wand2 } from 'lucide-react';
import {
  createPreventiveExamSchedule,
  lifePhaseFromAge,
  suggestExamsForPhase,
  LIFE_PHASE_LABELS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  type PreventiveExamItem,
  type WomensLifePhase,
  type PreventiveExamCategory,
  type PreventiveExamStatus,
} from '../../../api/preventive-exam-schedules.api';
import { cn } from '../../../utils/cn';

export default function NewPreventiveScheduleModal({
  patientId,
  onClose,
}: {
  patientId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0]!;
  const nextYear = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0]!;
  })();

  const [age, setAge] = useState<number>(35);
  const [lifePhase, setLifePhase] = useState<WomensLifePhase>('reproductive');
  const [generatedDate, setGeneratedDate] = useState<string>(today);
  const [nextReviewDate, setNextReviewDate] = useState<string>(nextYear);
  const [exams, setExams] = useState<PreventiveExamItem[]>([]);
  const [notes, setNotes] = useState<string>('');

  const handleAgeChange = (newAge: number) => {
    setAge(newAge);
    setLifePhase(lifePhaseFromAge(newAge));
  };

  const handleSuggest = () => {
    setExams(suggestExamsForPhase(lifePhase, generatedDate));
  };

  const updateExam = (idx: number, patch: Partial<PreventiveExamItem>) => {
    setExams((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const removeExam = (idx: number) => {
    setExams((prev) => prev.filter((_, i) => i !== idx));
  };

  const addBlankExam = () => {
    setExams((prev) => [
      ...prev,
      {
        examName: '',
        examCode: '',
        category: 'oncologic',
        frequency: '',
        recommendedDate: today,
        dueDate: today,
        lastPerformedDate: null,
        lastResult: null,
        status: 'due_soon',
        guideline: '',
        notes: null,
      },
    ]);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      return createPreventiveExamSchedule(patientId, {
        generatedDate,
        patientAgeAtGeneration: age,
        lifePhase,
        examSchedule: exams,
        nextReviewDate,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['preventive-exam-schedules', patientId] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-navy">Gerar cronograma de rastreios</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao salvar cronograma. Verifique os dados.
            </div>
          )}

          {/* Identificação */}
          <Section title="Identificação">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Idade da paciente">
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  onChange={(e) => handleAgeChange(Number(e.target.value))}
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Fase da vida">
                <select
                  value={lifePhase}
                  onChange={(e) => setLifePhase(e.target.value as WomensLifePhase)}
                  className={inputCn(false)}
                >
                  {Object.entries(LIFE_PHASE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Data de geração">
                <input
                  type="date"
                  value={generatedDate}
                  onChange={(e) => setGeneratedDate(e.target.value)}
                  className={inputCn(false)}
                />
              </Field>
            </div>
            <Field label="Próxima revisão">
              <input
                type="date"
                value={nextReviewDate}
                onChange={(e) => setNextReviewDate(e.target.value)}
                className={inputCn(false)}
              />
            </Field>
          </Section>

          {/* Exames sugeridos */}
          <Section title={`Exames (${exams.length})`}>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSuggest}
                className="flex items-center gap-2 px-3 py-2 bg-lilac/10 text-lilac text-sm font-medium rounded-lg hover:bg-lilac/20 transition"
              >
                <Wand2 className="w-4 h-4" />
                Sugerir exames para esta fase
              </button>
              <button
                type="button"
                onClick={addBlankExam}
                className="px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
              >
                + Adicionar exame
              </button>
            </div>

            {exams.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Nenhum exame ainda. Use "Sugerir" ou "Adicionar" acima.
              </p>
            ) : (
              <div className="space-y-3">
                {exams.map((exam, idx) => (
                  <ExamEditor
                    key={idx}
                    exam={exam}
                    onChange={(p) => updateExam(idx, p)}
                    onRemove={() => removeExam(idx)}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Notas */}
          <Section title="Observações">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas gerais sobre o cronograma..."
              className={inputCn(false)}
            />
          </Section>

          <div className="flex justify-end gap-3 pt-4 border-t -mx-6 px-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={exams.length === 0 || mutation.isPending}
              className="px-5 py-2.5 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition disabled:opacity-60 flex items-center gap-2"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar cronograma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamEditor({
  exam,
  onChange,
  onRemove,
}: {
  exam: PreventiveExamItem;
  onChange: (p: Partial<PreventiveExamItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
      <div className="flex items-start gap-2 mb-2">
        <input
          value={exam.examName}
          onChange={(e) => onChange({ examName: e.target.value })}
          placeholder="Nome do exame"
          className="flex-1 px-2 py-1 text-sm border-b border-gray-200 bg-transparent focus:outline-none focus:border-lilac"
        />
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <select
          value={exam.category}
          onChange={(e) => onChange({ category: e.target.value as PreventiveExamCategory })}
          className="px-2 py-1 border border-gray-200 rounded text-xs"
        >
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={exam.status}
          onChange={(e) => onChange({ status: e.target.value as PreventiveExamStatus })}
          className="px-2 py-1 border border-gray-200 rounded text-xs"
        >
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input
          value={exam.frequency}
          onChange={(e) => onChange({ frequency: e.target.value })}
          placeholder="Frequência (ex: anual)"
          className="px-2 py-1 border border-gray-200 rounded text-xs"
        />
        <input
          value={exam.guideline}
          onChange={(e) => onChange({ guideline: e.target.value })}
          placeholder="Diretriz (ex: FEBRASGO 2023)"
          className="px-2 py-1 border border-gray-200 rounded text-xs"
        />
        <input
          type="date"
          value={exam.recommendedDate}
          onChange={(e) => onChange({ recommendedDate: e.target.value })}
          className="px-2 py-1 border border-gray-200 rounded text-xs"
          title="Data recomendada"
        />
        <input
          type="date"
          value={exam.dueDate}
          onChange={(e) => onChange({ dueDate: e.target.value })}
          className="px-2 py-1 border border-gray-200 rounded text-xs"
          title="Vencimento"
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function inputCn(hasError: boolean) {
  return cn(
    'w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac transition',
    hasError ? 'border-red-400' : 'border-gray-300',
  );
}
