import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, AlertCircle } from 'lucide-react';
import portalApi from '../../api/portalClient';
import { usePatientAuthStore } from '../../store/patientAuth.store';

function formatCpfMask(value: string): string {
  const v = value.replace(/\D/g, '').slice(0, 11);
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

const STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA',
  'PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
];

export default function PortalOnboardingPage() {
  const navigate = useNavigate();
  const login = usePatientAuthStore((s) => s.login);
  const patient = usePatientAuthStore((s) => s.patient);

  const [form, setForm] = useState({
    fullName: patient?.fullName ?? '',
    dateOfBirth: '',
    cpf: '',
    phone: patient?.phone ?? '',
    zipCode: '',
    address: '',
    city: '',
    state: '',
    consentForResearch: false,
  });
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lgpdConsent) {
      setError('Você precisa aceitar os termos para continuar');
      return;
    }
    const cleanCpf = form.cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setError('CPF inválido');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await portalApi.post('/portal/complete-profile', {
        ...form,
        cpf: cleanCpf,
        zipCode: form.zipCode.replace(/\D/g, ''),
      });
      if (data.accessToken) {
        login(data.accessToken, { id: data.patientId, fullName: form.fullName, email: patient?.email ?? null, phone: form.phone || null });
      }
      navigate('/portal');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao completar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-lilac/10 to-white flex flex-col">
      <header className="bg-navy text-white px-6 pt-10 pb-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-lilac/20 -mr-24 -mt-24" />
        <div className="relative max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-6 h-6 text-lilac" fill="currentColor" />
            <h1 className="text-2xl font-bold">eliahealth</h1>
          </div>
          <p className="text-sm text-lilac/80">Complete seu perfil</p>
        </div>
      </header>

      <div className="flex-1 -mt-8 px-4 max-w-md mx-auto w-full pb-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <p className="text-sm text-gray-500 mb-2">
            Preencha seus dados para acessar o portal. Essas informações são confidenciais e protegidas.
          </p>

          <Field label="Nome completo" required>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
              required
            />
          </Field>

          <Field label="Data de nascimento" required>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
              required
            />
          </Field>

          <Field label="CPF" required>
            <input
              type="text"
              inputMode="numeric"
              value={form.cpf}
              onChange={(e) => set('cpf', formatCpfMask(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
              required
            />
          </Field>

          <Field label="Telefone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
            />
          </Field>

          <Field label="CEP" required>
            <input
              type="text"
              inputMode="numeric"
              value={form.zipCode}
              onChange={(e) => set('zipCode', e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="00000-000"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade">
              <input
                type="text"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
              />
            </Field>
            <Field label="Estado">
              <select
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
              >
                <option value="">—</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Endereco">
            <input
              type="text"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Rua, número, complemento"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
            />
          </Field>

          <div className="pt-2 space-y-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lgpdConsent}
                onChange={(e) => setLgpdConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-lilac focus:ring-lilac/50"
              />
              <span className="text-xs text-gray-600">
                Li e aceito a <strong>Politica de Privacidade</strong> e os <strong>Termos de Uso</strong> da EliaHealth, incluindo o tratamento dos meus dados pessoais conforme a LGPD.
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consentForResearch}
                onChange={(e) => set('consentForResearch', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-lilac focus:ring-lilac/50"
              />
              <span className="text-xs text-gray-600">
                Aceito que meus dados anonimizados sejam utilizados para fins de pesquisa científica (opcional).
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !lgpdConsent}
            className="w-full py-3.5 bg-lilac text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar e continuar
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
