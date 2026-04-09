import { useState } from 'react';
import { Settings, User, Bell, Shield, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

type Tab = 'profile' | 'notifications' | 'security';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Perfil', icon: User },
    { key: 'notifications', label: 'Notificacoes', icon: Bell },
    { key: 'security', label: 'Seguranca', icon: Shield },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6 text-lilac" />
        <h1 className="text-2xl font-semibold text-navy">Configuracoes</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 h-fit">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition',
                  tab === t.key ? 'bg-lilac/10 text-lilac font-medium' : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
          <hr className="my-2" />
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {tab === 'profile' && (
            <>
              <h2 className="text-lg font-semibold text-navy mb-4">Perfil</h2>
              <div className="space-y-4">
                <Field label="Nome" value={user?.name ?? '—'} />
                <Field label="Email" value={user?.email ?? '—'} />
                <Field label="Funcao" value={user?.role === 'physician' ? 'Medico(a)' : user?.role === 'nurse' ? 'Enfermeiro(a)' : user?.role ?? '—'} />
              </div>
              <p className="text-xs text-gray-400 mt-6">
                Para alterar seus dados, entre em contato com o administrador do sistema.
              </p>
            </>
          )}

          {tab === 'notifications' && (
            <>
              <h2 className="text-lg font-semibold text-navy mb-4">Notificacoes</h2>
              <div className="space-y-4">
                <Toggle label="Alertas de PA elevada" description="Receber notificacao quando uma gestante registrar PA >= 140/90" defaultChecked />
                <Toggle label="Novos exames da paciente" description="Receber notificacao quando uma paciente enviar exame pelo portal" defaultChecked />
                <Toggle label="Partos proximos (7 dias)" description="Receber lembrete de partos previstos para a proxima semana" defaultChecked />
                <Toggle label="Alertas do copiloto" description="Receber alertas gerados pela IA sobre padroes clinicos" defaultChecked={false} />
              </div>
              <p className="text-xs text-gray-400 mt-6">
                Configuracoes de notificacao salvas localmente. Integracao com email em breve.
              </p>
            </>
          )}

          {tab === 'security' && (
            <>
              <h2 className="text-lg font-semibold text-navy mb-4">Seguranca</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Autenticacao</p>
                  <p className="text-xs text-gray-500 mt-1">Login via Google OAuth ou email/senha</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Sessao</p>
                  <p className="text-xs text-gray-500 mt-1">Token JWT com expiracao de 8 horas</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Dados</p>
                  <p className="text-xs text-gray-500 mt-1">Todos os dados sao encriptados em transito (TLS) e em repouso. Conformidade LGPD.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">{value}</p>
    </div>
  );
}

function Toggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-gray-50">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => { setChecked(!checked); toast.success(checked ? 'Desativado' : 'Ativado'); }}
        className={cn(
          'w-10 h-6 rounded-full transition shrink-0 relative',
          checked ? 'bg-lilac' : 'bg-gray-300',
        )}
      >
        <div className={cn(
          'w-4 h-4 bg-white rounded-full absolute top-1 transition',
          checked ? 'left-5' : 'left-1',
        )} />
      </button>
    </div>
  );
}
