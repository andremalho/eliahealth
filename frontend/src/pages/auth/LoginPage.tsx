import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, KeyRound, X, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import Logo from '../../components/Logo';

const isWhiteLabel = import.meta.env.VITE_WHITE_LABEL === 'true';

const loginSchema = z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const GRAIN =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.9'/></svg>";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [showTokenLogin, setShowTokenLogin] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', data);
      const { accessToken, userId, role, name } = res.data;
      login(accessToken, { userId, email: data.email, role, name });
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Erro de conexão. Tente novamente.');
      }
    }
  };

  const handleCertificateLogin = async () => {
    setError(null);
    setCertLoading(true);

    try {
      const certData = await requestDigitalCertificate();

      if (!certData) {
        setError('Nenhum certificado digital selecionado.');
        setCertLoading(false);
        return;
      }

      const res = await api.post('/auth/certificate-login', certData);
      const { accessToken, userId, role, name } = res.data;
      login(accessToken, { userId, email: certData.email, role, name });
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(err.response.data?.message ?? 'Certificado não reconhecido.');
      } else {
        setError('Erro ao autenticar com certificado digital.');
      }
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* ══════════ LEFT — brand panel editorial ══════════ */}
      <div
        className="hidden lg:flex lg:w-[42%] relative overflow-hidden"
        style={{ background: '#14161F', color: '#F5EFE6' }}
      >
        {/* Grain */}
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
        {/* Aurora — sage + brass (nuance clínica) */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: '70%',
            height: '80%',
            background: 'radial-gradient(closest-side, rgba(156,168,154,0.22), transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-20%',
            width: '70%',
            height: '80%',
            background: 'radial-gradient(closest-side, rgba(201,169,119,0.16), transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        {/* Top brand */}
        <div className="absolute top-10 left-12 z-10">
          <Logo size="md" variant="light" product="health" />
        </div>

        {/* Editorial block */}
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16 max-w-xl">
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(245,239,230,0.6)',
              marginBottom: 22,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D97757' }} aria-hidden />
            Área clínica
          </div>
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(2.4rem, 4vw, 3.6rem)',
              fontWeight: 300,
              fontVariationSettings: "'opsz' 144, 'SOFT' 60",
              letterSpacing: '-0.03em',
              lineHeight: 1.04,
              color: '#F5EFE6',
              margin: '0 0 24px',
            }}
          >
            Saúde{' '}
            <span style={{ fontStyle: 'italic', color: '#C9A977' }}>íntegra</span>
            {' '}da mulher, em cada consulta
            <span aria-hidden style={{ color: '#D97757' }}>.</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: 'rgba(245,239,230,0.72)',
              maxWidth: 460,
              margin: 0,
            }}
          >
            Prontuário eletrônico especializado em ginecologia e obstetrícia, com inteligência clínica
            integrada e compliance LGPD por desenho.
          </p>

          {/* Footer stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
              marginTop: 56,
              paddingTop: 28,
              borderTop: '1px solid rgba(245,239,230,0.14)',
            }}
          >
            {[
              { v: '22', l: 'Módulos clínicos\nespecializados' },
              { v: '17', l: 'Templates de\nlaudo USG' },
              { v: 'LGPD', l: 'Compliance nativa\npor desenho' },
            ].map((s, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 28,
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    color: '#F5EFE6',
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(245,239,230,0.6)',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.45,
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT — form ══════════ */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: '#F5EFE6' }}
      >
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <Logo size="md" variant="dark" product="health" />
          </div>

          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#D97757',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D97757' }} aria-hidden />
            Entrar
          </div>

          <h2
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 32,
              fontWeight: 400,
              letterSpacing: '-0.025em',
              color: '#14161F',
              margin: '0 0 8px',
              lineHeight: 1.1,
            }}
          >
            Bem-vindo de volta.
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'rgba(20,22,31,0.62)',
              margin: '0 0 32px',
              lineHeight: 1.55,
            }}
          >
            Acesse o sistema com suas credenciais profissionais.
          </p>

          {error && (
            <div
              style={{
                marginBottom: 20,
                padding: '12px 16px',
                background: 'rgba(139,58,47,0.06)',
                borderLeft: '2px solid #8B3A2F',
                color: '#8B3A2F',
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(20,22,31,0.6)',
                  marginBottom: 10,
                }}
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ width: 16, height: 16, color: 'rgba(20,22,31,0.4)' }}
                />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="você@email.com"
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 46px',
                    border: `1px solid ${errors.email ? '#8B3A2F' : 'rgba(20,22,31,0.12)'}`,
                    borderRadius: 2,
                    background: '#FDFAF3',
                    color: '#14161F',
                    fontSize: 15,
                    fontFamily: "'Figtree', sans-serif",
                    outline: 'none',
                    transition: 'border-color 0.25s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#14161F')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = errors.email ? '#8B3A2F' : 'rgba(20,22,31,0.12)')}
                />
              </div>
              {errors.email && (
                <p style={{ marginTop: 6, fontSize: 12, color: '#8B3A2F' }}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(20,22,31,0.6)',
                  }}
                >
                  Senha
                </label>
                <a
                  href="#"
                  style={{
                    fontSize: 12,
                    color: '#14161F',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                    textDecorationColor: '#D97757',
                    fontWeight: 500,
                  }}
                >
                  Esqueci
                </a>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ width: 16, height: 16, color: 'rgba(20,22,31,0.4)' }}
                />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 46px',
                    border: `1px solid ${errors.password ? '#8B3A2F' : 'rgba(20,22,31,0.12)'}`,
                    borderRadius: 2,
                    background: '#FDFAF3',
                    color: '#14161F',
                    fontSize: 15,
                    fontFamily: "'Figtree', sans-serif",
                    outline: 'none',
                    transition: 'border-color 0.25s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#14161F')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = errors.password ? '#8B3A2F' : 'rgba(20,22,31,0.12)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(20,22,31,0.5)', padding: 4 }}
                >
                  {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ marginTop: 6, fontSize: 12, color: '#8B3A2F' }}>{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: 18,
                background: isSubmitting ? 'rgba(20,22,31,0.5)' : '#14161F',
                color: '#F5EFE6',
                fontFamily: "'Figtree', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: 2,
                cursor: isSubmitting ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'background 0.3s',
              }}
              onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = '#D97757'; }}
              onMouseLeave={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = '#14161F'; }}
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> Entrando…</>
              ) : (
                <>Entrar <ArrowRight style={{ width: 14, height: 14 }} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4" style={{ margin: '28px 0 22px' }}>
            <div className="flex-1 h-px" style={{ background: 'rgba(20,22,31,0.1)' }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: 'rgba(20,22,31,0.45)',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}
            >
              ou
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(20,22,31,0.1)' }} />
          </div>

          {/* Certificado Digital */}
          <button
            onClick={handleCertificateLogin}
            disabled={certLoading}
            style={{
              width: '100%',
              padding: 16,
              border: '1px solid rgba(20,22,31,0.14)',
              background: 'transparent',
              color: '#14161F',
              fontFamily: "'Figtree', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: certLoading ? 'default' : 'pointer',
              opacity: certLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'border-color 0.25s',
            }}
            onMouseEnter={(e) => { if (!certLoading) (e.currentTarget as HTMLElement).style.borderColor = '#D97757'; }}
            onMouseLeave={(e) => { if (!certLoading) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(20,22,31,0.14)'; }}
          >
            {certLoading ? (
              <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
            ) : (
              <ShieldCheck style={{ width: 16, height: 16, color: '#D97757' }} />
            )}
            {certLoading ? 'Lendo certificado…' : 'Certificado digital'}
          </button>

          {/* Token */}
          <button
            onClick={() => setShowTokenLogin(true)}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '12px 16px',
              border: '1px solid transparent',
              background: 'transparent',
              color: 'rgba(20,22,31,0.62)',
              fontFamily: "'Figtree', sans-serif",
              fontSize: 11.5,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'color 0.25s',
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = '#14161F'}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'rgba(20,22,31,0.62)'}
          >
            <KeyRound style={{ width: 13, height: 13 }} />
            Token (Bird ID · VIDaaS · SafeID)
          </button>

          <p
            style={{
              textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9.5,
              color: 'rgba(20,22,31,0.42)',
              marginTop: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            ICP-Brasil · Certisign · Valid
          </p>

          {showTokenLogin && (
            <TokenLoginModal
              onClose={() => setShowTokenLogin(false)}
              onLogin={async (provider, token, email) => {
                setError(null);
                try {
                  const res = await api.post('/auth/token-login', { token, provider, email });
                  const { accessToken, userId, role, name } = res.data;
                  login(accessToken, { userId, email, role, name });
                  navigate('/dashboard');
                } catch (err: any) {
                  setError(err.response?.data?.message ?? 'Erro ao autenticar com token.');
                  setShowTokenLogin(false);
                }
              }}
            />
          )}

          <div
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid rgba(20,22,31,0.1)',
              textAlign: 'center',
              fontSize: 14,
              color: 'rgba(20,22,31,0.62)',
            }}
          >
            Não tem conta?{' '}
            <Link
              to="/register"
              style={{
                color: '#14161F',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                textDecorationColor: '#D97757',
              }}
            >
              Criar acesso clínico
            </Link>
          </div>

          {!isWhiteLabel && (
            <p
              style={{
                textAlign: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: 'rgba(20,22,31,0.4)',
                marginTop: 20,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              Powered by elia
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Solicita certificado digital do navegador.
 * Em produção, integrar com Web PKI (Lacuna Software) ou similar.
 */
async function requestDigitalCertificate(): Promise<{
  thumbprint: string;
  subject: string;
  issuer: string;
  notAfter: string;
  email: string;
  provider: string;
} | null> {
  if (typeof (window as any).LacunaWebPKI !== 'undefined') {
    return new Promise((resolve) => {
      const pki = new (window as any).LacunaWebPKI();
      pki.init({
        ready: () => {
          pki.listCertificates().success((certs: any[]) => {
            if (certs.length === 0) { resolve(null); return; }
            const cert = certs[0];
            pki.readCertificate(cert.thumbprint).success((certData: any) => {
              const issuer = (certData.issuerName ?? '').toLowerCase();
              let provider = 'icp_brasil';
              if (issuer.includes('bird')) provider = 'bird_id';
              else if (issuer.includes('certisign')) provider = 'certisign';
              else if (issuer.includes('valid')) provider = 'valid';
              else if (issuer.includes('safeid')) provider = 'safeid';
              else if (issuer.includes('vidaas')) provider = 'vidaas';

              resolve({
                thumbprint: certData.thumbprint,
                subject: certData.subjectName,
                issuer: certData.issuerName,
                notAfter: certData.validityEnd,
                email: certData.email ?? certData.subjectName,
                provider,
              });
            });
          });
        },
        notInstalled: () => resolve(null),
      });
    });
  }

  const email = window.prompt('Certificado Digital — informe o e-mail vinculado:');
  if (!email) return null;

  return {
    thumbprint: 'dev-' + Date.now().toString(36),
    subject: `CN=${email}`,
    issuer: 'DEV ICP-Brasil',
    notAfter: new Date(Date.now() + 365 * 86400000).toISOString(),
    email,
    provider: 'icp_brasil',
  };
}

const TOKEN_PROVIDERS = [
  { value: 'bird_id', label: 'Bird ID' },
  { value: 'vidaas', label: 'VIDaaS' },
  { value: 'safeid', label: 'SafeID' },
  { value: 'certisign', label: 'Certisign' },
  { value: 'valid', label: 'Valid' },
];

function TokenLoginModal({
  onClose,
  onLogin,
}: {
  onClose: () => void;
  onLogin: (provider: string, token: string, email: string) => void;
}) {
  const [provider, setProvider] = useState('bird_id');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(20,22,31,0.62)', backdropFilter: 'blur(6px)' }}
    >
      <div
        style={{
          background: '#FDFAF3',
          border: '1px solid rgba(20,22,31,0.12)',
          width: '100%',
          maxWidth: 420,
          padding: 32,
          position: 'relative',
          fontFamily: "'Figtree', sans-serif",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4"
          style={{ color: 'rgba(20,22,31,0.6)', padding: 4 }}
        >
          <X style={{ width: 18, height: 18 }} />
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
            gap: 10,
          }}
        >
          <KeyRound style={{ width: 13, height: 13 }} />
          Login por token
        </div>

        <h3
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 22,
            fontWeight: 450,
            letterSpacing: '-0.015em',
            color: '#14161F',
            margin: '0 0 8px',
            lineHeight: 1.2,
          }}
        >
          Autenticar com token
        </h3>

        <p
          style={{
            fontSize: 13,
            color: 'rgba(20,22,31,0.62)',
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          Use o token temporário gerado pelo seu provedor de certificado digital.
        </p>

        <div className="space-y-4">
          {[
            {
              label: 'Provedor',
              field: (
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(20,22,31,0.12)',
                    borderRadius: 2,
                    background: '#FFFCF5',
                    color: '#14161F',
                    fontSize: 14,
                    fontFamily: "'Figtree', sans-serif",
                    outline: 'none',
                  }}
                >
                  {TOKEN_PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              ),
            },
            {
              label: 'E-mail',
              field: (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="você@email.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(20,22,31,0.12)',
                    borderRadius: 2,
                    background: '#FFFCF5',
                    color: '#14161F',
                    fontSize: 14,
                    fontFamily: "'Figtree', sans-serif",
                    outline: 'none',
                  }}
                />
              ),
            },
            {
              label: 'Token',
              field: (
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Cole o token aqui"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(20,22,31,0.12)',
                    borderRadius: 2,
                    background: '#FFFCF5',
                    color: '#14161F',
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    outline: 'none',
                    letterSpacing: '0.02em',
                  }}
                />
              ),
            },
          ].map((f) => (
            <div key={f.label}>
              <label
                style={{
                  display: 'block',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(20,22,31,0.55)',
                  marginBottom: 8,
                }}
              >
                {f.label}
              </label>
              {f.field}
            </div>
          ))}

          <button
            onClick={() => { if (token && email) onLogin(provider, token, email); }}
            disabled={!token || !email}
            style={{
              width: '100%',
              padding: 16,
              background: (!token || !email) ? 'rgba(20,22,31,0.4)' : '#14161F',
              color: '#F5EFE6',
              border: 'none',
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: (!token || !email) ? 'default' : 'pointer',
              fontFamily: "'Figtree', sans-serif",
              marginTop: 8,
              transition: 'background 0.3s',
            }}
            onMouseEnter={(e) => { if (token && email) (e.currentTarget as HTMLElement).style.background = '#D97757'; }}
            onMouseLeave={(e) => { if (token && email) (e.currentTarget as HTMLElement).style.background = '#14161F'; }}
          >
            Autenticar
          </button>
        </div>
      </div>
    </div>
  );
}
