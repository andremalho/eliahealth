import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Briefcase, Stethoscope, Heart } from 'lucide-react';
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
const SPECIALTIES = ['Obstetrícia', 'Ginecologia e Obstetrícia', 'Medicina de Família', 'Outro'];
const COUNCILS = ['COREN', 'CRF', 'CREFITO', 'CRN', 'CRP', 'Outro'];

type UserType = 'physician' | 'nurse' | 'patient';

const USER_TYPES: { value: UserType; icon: React.ElementType; title: string; desc: string }[] = [
  { value: 'physician', icon: Stethoscope, title: 'Médico', desc: 'Possui CRM ativo' },
  { value: 'nurse', icon: Briefcase, title: 'Profissional de Saúde', desc: 'Enfermeiro, fisioterapeuta, etc.' },
  { value: 'patient', icon: Heart, title: 'Paciente', desc: 'Gestante ou paciente' },
];

// Step 1 schema — validated via trigger() before advancing
const schema = z.object({
  userType: z.enum(['physician', 'nurse', 'patient']),
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
  // Step 2 fields — all optional at schema level, validated manually in onSubmit
  crm: z.string().optional(),
  crmState: z.string().optional(),
  coren: z.string().optional(),
  council: z.string().optional(),
  specialty: z.string().optional(),
  clinicName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  cpf: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem', path: ['confirmPassword'],
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
  const loginStore = useAuthStore((s) => s.login);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, trigger, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { userType: 'physician' },
  });

  const userType = watch('userType');
  const phoneValue = watch('phone') ?? '';

  const goToStep2 = async () => {
    const valid = await trigger(['userType', 'name', 'email', 'phone', 'password', 'confirmPassword']);
    if (valid) { setError(null); setStep(2); }
  };

  const onSubmit = async (data: FormData) => {
    setError(null);

    // Step 2 manual validation
    if (data.userType === 'physician') {
      if (!data.crm || !/^\d{4,}$/.test(data.crm)) { setError('CRM: mínimo 4 dígitos numéricos'); return; }
      if (!data.crmState) { setError('Selecione o estado do CRM'); return; }
    } else if (data.userType === 'nurse') {
      if (!data.coren) { setError('Número de registro obrigatório'); return; }
      if (!data.council) { setError('Selecione o conselho'); return; }
    } else {
      if (!data.dateOfBirth) { setError('Data de nascimento obrigatória'); return; }
      if (!data.cpf || !/^\d{11}$/.test(data.cpf)) { setError('CPF deve ter 11 dígitos'); return; }
    }

    const payload: Record<string, unknown> = {
      name: data.name, email: data.email, phone: data.phone, password: data.password,
      role: data.userType,
    };
    if (data.userType === 'physician') {
      Object.assign(payload, { crm: data.crm, crmState: data.crmState, specialty: data.specialty, clinicName: data.clinicName || undefined });
    } else if (data.userType === 'nurse') {
      Object.assign(payload, { coren: data.coren, council: data.council, specialty: data.specialty, clinicName: data.clinicName || undefined });
    } else {
      Object.assign(payload, { dateOfBirth: data.dateOfBirth, cpf: data.cpf });
    }
    console.log('[Register] Payload:', { ...payload, password: '***' });

    try {
      await api.post('/auth/register', payload);
    } catch (err: any) {
      console.error('[Register] Erro:', err.response?.status, err.response?.data);
      const s = err.response?.status;
      if (s === 409) { setError('Este e-mail já está cadastrado. Faça login ou use outro e-mail.'); setStep(1); }
      else if (s === 400) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join('. ') : (typeof msg === 'string' ? msg : 'Dados inválidos.'));
      } else { setError(err.response?.data?.message ?? 'Erro ao criar conta. Tente novamente.'); }
      return;
    }

    try {
      const res = await api.post('/auth/login', { email: data.email, password: data.password });
      loginStore(res.data.accessToken, { userId: res.data.userId, email: data.email, role: res.data.role, name: data.name });
      navigate('/dashboard');
    } catch { navigate('/login'); }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-[40%] flex-col items-center justify-center bg-panel relative overflow-hidden">
        <div className="absolute top-20 left-10 w-48 h-48 rounded-full bg-lilac/[0.08]" />
        <div className="absolute bottom-32 right-8 w-64 h-64 rounded-full bg-navy/[0.05]" />
        <div className="relative z-10 text-center px-12">
          <Logo size="lg" />
          <p className="mt-6 text-base text-gray-500 leading-relaxed max-w-xs mx-auto">{tagline}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8 bg-white overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden text-center mb-6"><Logo size="md" /></div>

          <div className="flex items-center gap-3 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold', step >= s ? 'bg-lilac text-white' : 'bg-gray-200 text-gray-500')}>{s}</div>
                <span className={cn('text-sm', step >= s ? 'text-navy font-medium' : 'text-gray-400')}>
                  {s === 1 ? 'Dados pessoais' : userType === 'patient' ? 'Dados pessoais' : 'Dados profissionais'}
                </span>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">Criar sua conta</h2>
          <p className="text-gray-500 mt-1 mb-5">Cadastre-se para começar a usar o EliaHealth</p>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Eu sou...</label>
                  <div className="grid grid-cols-3 gap-3">
                    {USER_TYPES.map(({ value, icon: Icon, title, desc }) => (
                      <button key={value} type="button"
                        onClick={() => setValue('userType', value, { shouldValidate: true })}
                        className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition',
                          userType === value ? 'border-lilac bg-lilac/5' : 'border-gray-200 hover:border-gray-300')}>
                        <Icon className={cn('w-6 h-6', userType === value ? 'text-lilac' : 'text-gray-400')} />
                        <span className={cn('text-sm font-medium', userType === value ? 'text-navy' : 'text-gray-600')}>{title}</span>
                        <span className="text-[10px] text-gray-400 leading-tight">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="Nome completo *" icon={User} error={errors.name?.message}>
                  <input {...register('name')} placeholder="João Silva" className={inputCn(!!errors.name)} />
                </Field>
                <Field label="E-mail *" icon={Mail} error={errors.email?.message}>
                  <input {...register('email')} type="email" placeholder="joao@clinica.com" className={inputCn(!!errors.email)} />
                </Field>
                <Field label="Telefone *" icon={Phone} error={errors.phone?.message}>
                  <input value={phoneValue} onChange={(e) => setValue('phone', phoneMask(e.target.value), { shouldValidate: true })} placeholder="(11) 99999-9999" className={inputCn(!!errors.phone)} />
                </Field>
                <Field label="Senha *" icon={Lock} error={errors.password?.message}>
                  <div className="relative">
                    <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="Mín. 8 chars, A-z, 0-9, !@#" className={cn(inputCn(!!errors.password), 'pr-10')} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Confirmar senha *" icon={Lock} error={errors.confirmPassword?.message}>
                  <div className="relative">
                    <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} placeholder="Repita a senha" className={cn(inputCn(!!errors.confirmPassword), 'pr-10')} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
                <button type="button" onClick={goToStep2} className="w-full py-3 bg-lilac text-white font-medium rounded-lg hover:bg-primary-dark transition flex items-center justify-center gap-2">
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {userType === 'physician' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
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
                    <Field label="Especialidade"><select {...register('specialty')} className={inputCn(false)}><option value="">Selecione...</option>{SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
                    <Field label="Consultório/clínica"><input {...register('clinicName')} placeholder="Opcional" className={inputCn(false)} /></Field>
                  </>
                )}
                {userType === 'nurse' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nº de registro *" icon={Briefcase} error={errors.coren?.message}>
                        <input {...register('coren')} placeholder="123456" className={inputCn(!!errors.coren)} />
                      </Field>
                      <Field label="Conselho *" error={errors.council?.message}>
                        <select {...register('council')} className={inputCn(!!errors.council)}>
                          <option value="">Selecione...</option>
                          {COUNCILS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Especialidade"><select {...register('specialty')} className={inputCn(false)}><option value="">Selecione...</option>{SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
                    <Field label="Consultório/clínica"><input {...register('clinicName')} placeholder="Opcional" className={inputCn(false)} /></Field>
                  </>
                )}
                {userType === 'patient' && (
                  <>
                    <Field label="Data de nascimento *" error={errors.dateOfBirth?.message}>
                      <input {...register('dateOfBirth')} type="date" className={inputCn(!!errors.dateOfBirth)} />
                    </Field>
                    <Field label="CPF *" error={errors.cpf?.message}>
                      <input {...register('cpf')} placeholder="12345678901" maxLength={11} className={inputCn(!!errors.cpf)} />
                    </Field>
                  </>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-lilac text-white font-medium rounded-lg hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isSubmitting ? 'Criando...' : 'Criar conta'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta? <Link to="/login" className="text-lilac font-medium hover:text-primary-dark">Entrar</Link>
          </p>
          {!isWhiteLabel && <p className="text-center text-xs text-gray-400 mt-4">Powered by EliaHealth</p>}
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
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />}
        <div className={Icon ? '[&>input]:pl-11 [&>select]:pl-11 [&>div>input]:pl-11' : ''}>{children}</div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputCn(hasError: boolean) {
  return cn(
    'w-full px-3 py-2.5 border rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/40 focus:border-lilac transition text-sm',
    hasError ? 'border-red-400' : 'border-gray-300',
  );
}
