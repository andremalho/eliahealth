import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Lock, Loader2, ArrowRight, ArrowLeft, Briefcase } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../utils/cn';
import Logo from '../../components/Logo';

const isWhiteLabel = import.meta.env.VITE_WHITE_LABEL === 'true';
const tagline = import.meta.env.VITE_APP_TAGLINE ?? 'Prontuário pré-natal inteligente';

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const SPECIALTIES = [
  'Obstetrícia',
  'Ginecologia e Obstetrícia',
  'Medicina de Família',
  'Outro',
];

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  phone: z.string().min(14, 'Telefone inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[a-z]/, 'Deve conter letra minúscula')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/\d/, 'Deve conter número')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Deve conter caractere especial'),
  confirmPassword: z.string().min(1, 'Confirme a senha'),
  crm: z.string().regex(/^\d{4,}$/, 'CRM: mínimo 4 dígitos numéricos'),
  crmState: z.string().min(1, 'Selecione o estado'),
  specialty: z.string().min(1, 'Selecione a especialidade'),
  clinicName: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

function phoneMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onTouched' });

  const phoneValue = watch('phone') ?? '';

  const goToStep2 = async () => {
    const valid = await trigger(['name', 'email', 'phone', 'password', 'confirmPassword']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: 'physician' as const,
      crm: data.crm,
      crmState: data.crmState,
      specialty: data.specialty,
      clinicName: data.clinicName || undefined,
    };
    console.log('[Register] Payload:', { ...payload, password: '***' });

    try {
      await api.post('/auth/register', payload);
      console.log('[Register] Sucesso, fazendo auto-login...');
    } catch (err: any) {
      console.error('[Register] Erro:', err.response?.status, err.response?.data);
      const status = err.response?.status;
      if (status === 409) {
        setError('Este e-mail já está cadastrado. Tente outro e-mail ou faça login.');
        setStep(1);
        return;
      }
      if (status === 400) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join('. ') : (typeof msg === 'string' ? msg : 'Dados inválidos. Verifique os campos.'));
        return;
      }
      setError(err.response?.data?.message ?? 'Erro ao criar conta. Tente novamente.');
      return;
    }

    try {
      const res = await api.post('/auth/login', { email: data.email, password: data.password });
      console.log('[Register] Login OK, redirecionando...');
      login(res.data.accessToken, { userId: res.data.userId, email: data.email, role: res.data.role, name: data.name });
      navigate('/dashboard');
    } catch (loginErr: any) {
      console.error('[Register] Erro no auto-login:', loginErr.response?.status, loginErr.response?.data);
      setError('Conta criada com sucesso! Faça login manualmente.');
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[40%] flex-col items-center justify-center bg-panel relative overflow-hidden">
        <div className="absolute top-20 left-10 w-48 h-48 rounded-full bg-lilac/[0.08]" />
        <div className="absolute bottom-32 right-8 w-64 h-64 rounded-full bg-navy/[0.05]" />
        <div className="relative z-10 text-center px-12">
          <Logo size="lg" />
          <p className="mt-6 text-base text-gray-500 leading-relaxed max-w-xs mx-auto">
            {tagline}
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Logo size="md" />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                  step >= s ? 'bg-lilac text-white' : 'bg-gray-200 text-gray-500',
                )}>
                  {s}
                </div>
                <span className={cn('text-sm', step >= s ? 'text-navy font-medium' : 'text-gray-400')}>
                  {s === 1 ? 'Dados pessoais' : 'Dados profissionais'}
                </span>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">Criar sua conta</h2>
          <p className="text-gray-500 mt-1 mb-6">Cadastre-se para começar a usar o EliaHealth</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <Field label="Nome completo *" icon={User} error={errors.name?.message}>
                  <input {...register('name')} placeholder="Dr. João Silva" className={inputCn(!!errors.name)} />
                </Field>

                <Field label="E-mail *" icon={Mail} error={errors.email?.message}>
                  <input {...register('email')} type="email" placeholder="joao@clinica.com" className={inputCn(!!errors.email)} />
                </Field>

                <Field label="Telefone *" icon={Phone} error={errors.phone?.message}>
                  <input
                    {...register('phone')}
                    value={phoneValue}
                    onChange={(e) => setValue('phone', phoneMask(e.target.value), { shouldValidate: true })}
                    placeholder="(11) 99999-9999"
                    className={inputCn(!!errors.phone)}
                  />
                </Field>

                <Field label="Senha *" icon={Lock} error={errors.password?.message}>
                  <input {...register('password')} type="password" placeholder="Mínimo 8 caracteres" className={inputCn(!!errors.password)} />
                </Field>

                <Field label="Confirmar senha *" icon={Lock} error={errors.confirmPassword?.message}>
                  <input {...register('confirmPassword')} type="password" placeholder="Repita a senha" className={inputCn(!!errors.confirmPassword)} />
                </Field>

                <button
                  type="button"
                  onClick={goToStep2}
                  className="w-full py-3 bg-lilac text-white font-medium rounded-lg hover:bg-primary-dark transition flex items-center justify-center gap-2"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="CRM *" icon={Briefcase} error={errors.crm?.message}>
                    <input {...register('crm')} placeholder="123456" className={inputCn(!!errors.crm)} />
                  </Field>
                  <Field label="Estado do CRM *" error={errors.crmState?.message}>
                    <select {...register('crmState')} className={inputCn(!!errors.crmState)}>
                      <option value="">UF</option>
                      {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Especialidade *" error={errors.specialty?.message}>
                  <select {...register('specialty')} className={inputCn(!!errors.specialty)}>
                    <option value="">Selecione...</option>
                    {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>

                <Field label="Nome do consultório/clínica">
                  <input {...register('clinicName')} placeholder="Clínica Exemplo (opcional)" className={inputCn(false)} />
                </Field>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-lilac text-white font-medium rounded-lg hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isSubmitting ? 'Criando...' : 'Criar conta'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Já tem conta?{' '}
            <Link to="/login" className="text-lilac font-medium hover:text-primary-dark">
              Entrar
            </Link>
          </p>

          {!isWhiteLabel && (
            <p className="text-center text-xs text-gray-400 mt-6">
              Powered by EliaHealth
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, error, children }: { label: string; icon?: React.ElementType; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
        <div className={Icon ? '[&>input]:pl-11 [&>select]:pl-11' : ''}>{children}</div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputCn(hasError: boolean) {
  return cn(
    'w-full px-3 py-3 border rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/40 focus:border-lilac transition text-sm',
    hasError ? 'border-red-400' : 'border-gray-300',
  );
}
