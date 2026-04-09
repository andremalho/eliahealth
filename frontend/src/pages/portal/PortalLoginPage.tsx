import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Heart, ArrowLeft, AlertCircle } from 'lucide-react';
import { requestOtp, verifyOtp } from '../../api/portal.api';
import { usePatientAuthStore } from '../../store/patientAuth.store';
import { cn } from '../../utils/cn';

function formatCpfMask(value: string): string {
  const v = value.replace(/\D/g, '').slice(0, 11);
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function PortalLoginPage() {
  const navigate = useNavigate();
  const login = usePatientAuthStore((s) => s.login);

  const [step, setStep] = useState<'cpf' | 'code'>('cpf');
  const [cpf, setCpf] = useState('');
  const [code, setCode] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) {
      setError('CPF inválido');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await requestOtp(clean);
      setChannels(result.channels);
      setDevCode(result.devCode);
      setStep('code');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Código deve ter 6 dígitos');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(cpf.replace(/\D/g, ''), code);
      login(result.accessToken, result.patient);
      navigate('/portal');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-lilac/10 to-white flex flex-col">
      {/* Header */}
      <header className="bg-navy text-white px-6 pt-10 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-lilac/20 -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-lilac/10 -ml-16 -mb-16" />
        <div className="relative max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-6 h-6 text-lilac" fill="currentColor" />
            <h1 className="text-2xl font-bold">eliahealth</h1>
          </div>
          <p className="text-sm text-lilac/80">Portal da Gestante</p>
        </div>
      </header>

      <div className="flex-1 -mt-10 px-4 max-w-md mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {step === 'cpf' ? (
            <>
              <h2 className="text-xl font-semibold text-navy">Olá!</h2>
              <p className="text-sm text-gray-500 mt-1 mb-6">
                Digite seu CPF para acessar seu cartão de pré-natal.
              </p>
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">CPF</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpfMask(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-lilac text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enviar código
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('cpf'); setCode(''); setError(null); }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-lilac mb-3"
              >
                <ArrowLeft className="w-3 h-3" /> Voltar
              </button>
              <h2 className="text-xl font-semibold text-navy">Digite o código</h2>
              <p className="text-sm text-gray-500 mt-1 mb-2">
                Enviamos um código de 6 dígitos
                {channels.length > 0 && (
                  <> para {channels.includes('email') ? 'seu e-mail' : ''}
                  {channels.length === 2 ? ' e ' : ''}
                  {channels.includes('whatsapp') ? 'seu WhatsApp' : ''}.</>
                )}
              </p>
              {devCode && (
                <p className="text-[10px] text-amber-600 mb-4 bg-amber-50 border border-amber-200 rounded p-2">
                  ⚠️ DEV: código <strong>{devCode}</strong>
                </p>
              )}
              <form onSubmit={handleVerify} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg text-2xl text-center tracking-[0.5em] font-mono text-navy focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
                  autoFocus
                />
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className={cn(
                    'w-full py-3.5 font-medium rounded-lg flex items-center justify-center gap-2',
                    code.length === 6 ? 'bg-lilac text-white hover:bg-primary-dark' : 'bg-gray-100 text-gray-400',
                    loading && 'opacity-60',
                  )}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Entrar
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Portal exclusivo para gestantes cadastradas pela equipe médica.
        </p>
      </div>
    </div>
  );
}
