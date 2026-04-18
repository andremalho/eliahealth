import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { requestOtp, verifyOtp } from '../../api/portal.api';
import { usePatientAuthStore } from '../../store/patientAuth.store';
import Logo from '../../components/Logo';

function formatCpfMask(value: string): string {
  const v = value.replace(/\D/g, '').slice(0, 11);
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

const GRAIN =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.9'/></svg>";

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
      setError('CPF inválido.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await requestOtp(clean);
      setChannels(result.channels);
      setDevCode(result.devCode);
      setStep('code');
      toast.success('Código enviado.');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao enviar código.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Código deve ter 6 dígitos.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(cpf.replace(/\D/g, ''), code);
      login(result.accessToken, result.patient);
      navigate('/portal');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#F5EFE6', fontFamily: "'Figtree', sans-serif" }}
    >
      {/* ══════════ Header editorial ══════════ */}
      <header
        className="relative overflow-hidden"
        style={{
          background: '#14161F',
          color: '#F5EFE6',
          padding: '40px 24px 100px',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.05,
            mixBlendMode: 'overlay',
            backgroundImage: `url("${GRAIN}")`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-40%',
            right: '-20%',
            width: '70%',
            height: '180%',
            background: 'radial-gradient(closest-side, rgba(217,119,87,0.26), transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-40%',
            left: '-20%',
            width: '70%',
            height: '120%',
            background: 'radial-gradient(closest-side, rgba(201,169,119,0.14), transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="relative max-w-md mx-auto">
          <Logo size="md" variant="light" product="health" />
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(245,239,230,0.7)',
              marginTop: 22,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D97757' }} aria-hidden />
            Portal da paciente
          </div>
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              color: '#F5EFE6',
              marginTop: 14,
              marginBottom: 0,
              lineHeight: 1.1,
            }}
          >
            Seu cuidado,{' '}
            <span style={{ fontStyle: 'italic', color: '#E89A80' }}>sempre com você</span>
            <span aria-hidden style={{ color: '#D97757' }}>.</span>
          </h1>
        </div>
      </header>

      {/* ══════════ Card ══════════ */}
      <div className="flex-1 px-4 max-w-md mx-auto w-full" style={{ marginTop: -56 }}>
        <div
          style={{
            background: '#FDFAF3',
            border: '1px solid rgba(20,22,31,0.08)',
            padding: 32,
            position: 'relative',
          }}
        >
          {step === 'cpf' ? (
            <>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: '#D97757',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D97757' }} aria-hidden />
                Passo 01
              </div>
              <h2
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 26,
                  fontWeight: 450,
                  letterSpacing: '-0.02em',
                  color: '#14161F',
                  margin: '0 0 8px',
                  lineHeight: 1.15,
                }}
              >
                Olá.
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(20,22,31,0.62)',
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}
              >
                Digite seu CPF para acessar seu cartão de pré-natal.
              </p>
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'rgba(20,22,31,0.55)',
                      marginBottom: 10,
                    }}
                  >
                    CPF
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpfMask(e.target.value))}
                    placeholder="000.000.000-00"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid rgba(20,22,31,0.12)',
                      borderRadius: 2,
                      background: '#FFFCF5',
                      color: '#14161F',
                      fontSize: 17,
                      letterSpacing: '0.04em',
                      fontFamily: "'JetBrains Mono', monospace",
                      outline: 'none',
                      transition: 'border-color 0.25s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#14161F')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(20,22,31,0.12)')}
                    autoFocus
                  />
                </div>
                {error && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px 14px',
                      background: 'rgba(139,58,47,0.06)',
                      borderLeft: '2px solid #8B3A2F',
                    }}
                  >
                    <AlertCircle style={{ width: 14, height: 14, color: '#8B3A2F', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12.5, color: '#8B3A2F', margin: 0, lineHeight: 1.45 }}>{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: 18,
                    background: loading ? 'rgba(20,22,31,0.5)' : '#14161F',
                    color: '#F5EFE6',
                    border: 'none',
                    borderRadius: 2,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    cursor: loading ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    fontFamily: "'Figtree', sans-serif",
                    transition: 'background 0.3s',
                  }}
                  onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#D97757'; }}
                  onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#14161F'; }}
                >
                  {loading ? (
                    <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> Enviando…</>
                  ) : (
                    <>Enviar código <ArrowRight style={{ width: 14, height: 14 }} /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('cpf'); setCode(''); setError(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: 'rgba(20,22,31,0.55)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 16,
                  fontFamily: "'Figtree', sans-serif",
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: 0,
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = '#14161F'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'rgba(20,22,31,0.55)'}
              >
                <ArrowLeft style={{ width: 12, height: 12 }} /> Voltar
              </button>

              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: '#D97757',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D97757' }} aria-hidden />
                Passo 02
              </div>

              <h2
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 26,
                  fontWeight: 450,
                  letterSpacing: '-0.02em',
                  color: '#14161F',
                  margin: '0 0 8px',
                  lineHeight: 1.15,
                }}
              >
                Digite o código.
              </h2>
              <p
                style={{
                  fontSize: 13.5,
                  color: 'rgba(20,22,31,0.62)',
                  marginBottom: 10,
                  lineHeight: 1.5,
                }}
              >
                Enviamos um código de 6 dígitos
                {channels.length > 0 && (
                  <> para {channels.includes('email') ? 'seu e-mail' : ''}
                  {channels.length === 2 ? ' e ' : ''}
                  {channels.includes('whatsapp') ? 'seu WhatsApp' : ''}.</>
                )}
              </p>
              {devCode && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#7A5F2E',
                    marginBottom: 20,
                    background: 'rgba(201,169,119,0.1)',
                    borderLeft: '2px solid #C9A977',
                    padding: '8px 14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.08em',
                  }}
                >
                  DEV · código <strong>{devCode}</strong>
                </div>
              )}
              <form onSubmit={handleVerify} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{
                    width: '100%',
                    padding: '20px 14px',
                    border: '1px solid rgba(20,22,31,0.12)',
                    borderRadius: 2,
                    background: '#FFFCF5',
                    color: '#14161F',
                    fontSize: 28,
                    textAlign: 'center',
                    letterSpacing: '0.5em',
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 400,
                    outline: 'none',
                    transition: 'border-color 0.25s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#D97757')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(20,22,31,0.12)')}
                  autoFocus
                />
                {error && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px 14px',
                      background: 'rgba(139,58,47,0.06)',
                      borderLeft: '2px solid #8B3A2F',
                    }}
                  >
                    <AlertCircle style={{ width: 14, height: 14, color: '#8B3A2F', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12.5, color: '#8B3A2F', margin: 0, lineHeight: 1.45 }}>{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  style={{
                    width: '100%',
                    padding: 18,
                    background: (loading || code.length !== 6) ? 'rgba(20,22,31,0.4)' : '#14161F',
                    color: '#F5EFE6',
                    border: 'none',
                    borderRadius: 2,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    cursor: (loading || code.length !== 6) ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    fontFamily: "'Figtree', sans-serif",
                    transition: 'background 0.3s',
                  }}
                  onMouseEnter={(e) => { if (!loading && code.length === 6) (e.currentTarget as HTMLElement).style.background = '#D97757'; }}
                  onMouseLeave={(e) => { if (!loading && code.length === 6) (e.currentTarget as HTMLElement).style.background = '#14161F'; }}
                >
                  {loading && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
                  Entrar
                </button>
              </form>
            </>
          )}
        </div>

        <p
          style={{
            textAlign: 'center',
            fontFamily: "'Fraunces', serif",
            fontStyle: 'italic',
            fontSize: 13,
            color: 'rgba(20,22,31,0.5)',
            marginTop: 24,
            lineHeight: 1.55,
          }}
        >
          Portal exclusivo para gestantes cadastradas pela equipe médica.
        </p>
      </div>
    </div>
  );
}
