import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, Mail, Shield, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/client';
import { cn } from '../../utils/cn';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

async function fetchTeam() {
  const { data } = await api.get('/teams');
  return data as TeamMember[];
}

async function inviteMember(dto: { email: string; role: string }) {
  const { data } = await api.post('/teams/invite', dto);
  return data;
}

async function removeMember(id: string) {
  await api.delete(`/teams/${id}`);
}

const ROLE_LABELS: Record<string, string> = {
  physician: 'Medico(a)',
  nurse: 'Enfermeiro(a)',
  admin: 'Administrador(a)',
  receptionist: 'Recepcionista',
};

const ROLE_COLORS: Record<string, string> = {
  physician: 'bg-lilac/10 text-lilac',
  nurse: 'bg-emerald-50 text-emerald-700',
  admin: 'bg-amber-50 text-amber-700',
  receptionist: 'bg-gray-100 text-gray-600',
};

export default function TeamsPage() {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('physician');

  const { data: members, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: fetchTeam,
  });

  const invite = useMutation({
    mutationFn: () => inviteMember({ email, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      toast.success('Convite enviado');
      setInviteOpen(false);
      setEmail('');
    },
    onError: () => toast.error('Falha ao enviar convite'),
  });

  const remove = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      toast.success('Membro removido');
    },
  });

  const team = members ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Equipe</h1>
          <p className="text-sm text-gray-500 mt-1">{team.length} membro{team.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" /> Convidar
        </button>
      </div>

      {/* Invite form */}
      {inviteOpen && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <h3 className="text-sm font-semibold text-navy mb-3">Convidar membro</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
            >
              <option value="physician">Medico(a)</option>
              <option value="nurse">Enfermeiro(a)</option>
              <option value="admin">Administrador(a)</option>
              <option value="receptionist">Recepcionista</option>
            </select>
            <button
              onClick={() => invite.mutate()}
              disabled={!email || invite.isPending}
              className="px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg disabled:opacity-60 flex items-center gap-2"
            >
              {invite.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Enviar
            </button>
            <button onClick={() => setInviteOpen(false)} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
          </div>
          {invite.error && (
            <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" /> Falha ao enviar convite
            </div>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : team.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Users className="w-12 h-12 mb-3" />
            <p className="font-medium">Nenhum membro na equipe</p>
            <p className="text-sm mt-1">Convide colegas para colaborar</p>
          </div>
        ) : (
          <div className="divide-y">
            {team.map((m) => {
              const initials = m.name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
              return (
                <div key={m.id} className="flex items-center gap-4 p-4 group hover:bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {initials || <Users className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{m.name || m.email}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{m.email}</span>
                    </div>
                  </div>
                  <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', ROLE_COLORS[m.role] ?? 'bg-gray-100 text-gray-600')}>
                    <Shield className="w-3 h-3 inline mr-1" />
                    {ROLE_LABELS[m.role] ?? m.role}
                  </span>
                  {m.status === 'pending' && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-medium rounded-full">Pendente</span>
                  )}
                  <button
                    onClick={() => { if (window.confirm(`Remover ${m.name || m.email} da equipe?`)) remove.mutate(m.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
