import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, KeyRound, X } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../utils/cn';
import Logo from '../../components/Logo';

const isWhiteLabel = import.meta.env.VITE_WHITE_LABEL === 'true';
const tagline = import.meta.env.VITE_APP_TAGLINE ?? 'Prontuario exclusivo da mulher';

const loginSchema = z.object({
  email: z.string().min(1, 'E-mail obrigatorio').email('E-mail invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

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
        setError('E-mail ou senha incorretos');
      } else {
        setError('Erro de conexao. Tente novamente.');
      }
    }
  };

  const handleCertificateLogin = async () => {
    setError(null);
    setCertLoading(true);

    try {
      const certData = await requestDigitalCertificate();

      if (!certData) {
        setError('Nenhum certificado digital selecionado');
        setCertLoading(false);
        return;
      }

      const res = await api.post('/auth/certificate-login', certData);
      const { accessToken, userId, role, name } = res.data;
      login(accessToken, { userId, email: certData.email, role, name });
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(err.response.data?.message ?? 'Certificado nao reconhecido');
      } else {
        setError('Erro ao autenticar com certificado digital');
      }
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[40%] flex-col items-center justify-center bg-panel relative overflow-hidden">
        <div className="absolute top-20 left-10 w-48 h-48 rounded-full bg-lilac/[0.08]" />
        <div className="absolute bottom-32 right-8 w-64 h-64 rounded-full bg-navy/[0.05]" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-lilac/[0.06]" />

        <div className="relative z-10 text-center px-12">
          <Logo size="lg" />
          <p className="mt-6 text-base text-gray-500 leading-relaxed max-w-xs mx-auto">
            {tagline}
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <Logo size="md" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">
            Bem-vindo de volta
          </h2>
          <p className="text-gray-500 mt-1 mb-8">
            Entre com suas credenciais para acessar o sistema
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  className={cn(
                    'w-full pl-11 pr-4 py-3 border rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition',
                    errors.email ? 'border-red-400' : 'border-gray-300',
                  )}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-gray-700">Senha</label>
                <a href="#" className="text-xs text-primary hover:text-primary-dark">Esqueci minha senha</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    'w-full pl-11 pr-12 py-3 border rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition',
                    errors.password ? 'border-red-400' : 'border-gray-300',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Certificado Digital */}
          <button
            onClick={handleCertificateLogin}
            disabled={certLoading}
            className="w-full py-3 border border-navy/30 rounded-lg text-navy font-medium hover:bg-navy/5 transition flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {certLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-lilac" />
            )}
            {certLoading ? 'Lendo certificado...' : 'Entrar com Certificado Digital'}
          </button>

          {/* Token temporario (Bird ID, VIDaaS, SafeID) */}
          <button
            onClick={() => setShowTokenLogin(true)}
            className="w-full mt-2 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-gray-400" />
            Entrar com Token (Bird ID, VIDaaS, SafeID)
          </button>

          <p className="text-center text-[11px] text-gray-400 mt-2">
            ICP-Brasil, Bird ID, Certisign, Valid, SafeID, VIDaaS
          </p>

          {/* Modal token login */}
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
                  setError(err.response?.data?.message ?? 'Erro ao autenticar com token');
                  setShowTokenLogin(false);
                }
              }}
            />
          )}

          <p className="text-center text-sm text-gray-500 mt-8">
            Nao tem conta?{' '}
            <Link to="/register" className="text-primary font-medium hover:text-primary-dark">
              Criar conta gratuita
            </Link>
          </p>

          {!isWhiteLabel && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Powered by EliaHealth
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Solicita certificado digital do navegador.
 * Em producao, integrar com Web PKI (Lacuna Software) ou similar.
 */
async function requestDigitalCertificate(): Promise<{
  thumbprint: string;
  subject: string;
  issuer: string;
  notAfter: string;
  email: string;
  provider: string;
} | null> {
  // Web PKI (Lacuna Software) — certificados ICP-Brasil, Bird ID, Certisign, Valid
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

  // Fallback dev
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-lilac" />
          <h3 className="font-semibold text-navy">Login por Token</h3>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Use o token temporario gerado pelo seu provedor de certificado digital.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Provedor</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {TOKEN_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Cole o token aqui..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button
            onClick={() => { if (token && email) onLogin(provider, token, email); }}
            disabled={!token || !email}
            className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
          >
            Autenticar
          </button>
        </div>
      </div>
    </div>
  );
}
