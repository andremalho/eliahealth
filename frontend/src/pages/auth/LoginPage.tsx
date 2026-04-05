import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../utils/cn';
import Logo from '../../components/Logo';

const isWhiteLabel = import.meta.env.VITE_WHITE_LABEL === 'true';
const tagline = import.meta.env.VITE_APP_TAGLINE ?? 'Prontuário pré-natal inteligente';

const loginSchema = z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', data);
      const { accessToken, userId, role } = res.data;
      login(accessToken, { userId, email: data.email, role });
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('E-mail ou senha incorretos');
      } else {
        setError('Erro de conexão. Tente novamente.');
      }
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/auth/google`;
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[40%] flex-col items-center justify-center bg-panel relative overflow-hidden">
        {/* Decorative circles */}
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
          {/* Mobile logo */}
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
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail
              </label>
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
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-gray-700">Senha</label>
                <a href="#" className="text-xs text-primary hover:text-primary-dark">
                  Esqueci minha senha
                </a>
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
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

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar com Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-8">
            Não tem conta?{' '}
            <Link to="/register" className="text-primary font-medium hover:text-primary-dark">
              Criar conta gratuita
            </Link>
          </p>

          {/* Footer */}
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
