import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { fetchConversations, fetchMessages, sendMessage, markRead } from '../../api/chat.api';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function ChatPage() {
  const qc = useQueryClient();
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [activePatientName, setActivePatientName] = useState('');
  const [newMsg, setNewMsg] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({ queryKey: ['chat-conversations'], queryFn: fetchConversations });
  const { data: messages } = useQuery({
    queryKey: ['chat-messages', activePatientId],
    queryFn: () => fetchMessages(activePatientId!),
    enabled: !!activePatientId,
    refetchInterval: 5000,
  });

  const sendMut = useMutation({
    mutationFn: () => sendMessage(activePatientId!, newMsg),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chat-messages', activePatientId] }); setNewMsg(''); },
  });

  const convos = Array.isArray(conversations) ? conversations : [];
  const msgs = messages?.data ?? [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  useEffect(() => {
    if (activePatientId) markRead(activePatientId).then(() => qc.invalidateQueries({ queryKey: ['chat-conversations'] }));
  }, [activePatientId, qc]);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-navy mb-6">Mensagens</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-180px)]">
        {/* Conversations list */}
        <Card padding="none" className="overflow-y-auto">
          {convos.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="Sem conversas" compact />
          ) : (
            <div className="divide-y">
              {convos.map((c: any) => {
                const name = c.patient_name ?? c.patientName ?? '—';
                const pid = c.patient_id ?? c.patientId;
                const isActive = activePatientId === pid;
                return (
                  <button key={pid} onClick={() => { setActivePatientId(pid); setActivePatientName(name); }}
                    className={cn('w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition', isActive && 'bg-lilac/5 border-l-2 border-lilac')}>
                    <Avatar name={name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{toTitleCase(name)}</p>
                      <p className="text-xs text-gray-400 truncate">{c.content}</p>
                    </div>
                    {c.unread > 0 && <Badge variant="primary" size="xs">{c.unread}</Badge>}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Messages */}
        <Card padding="none" className="flex flex-col">
          {!activePatientId ? (
            <EmptyState icon={<MessageSquare className="w-12 h-12" />} title="Selecione uma conversa" className="flex-1" />
          ) : (
            <>
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-navy">{toTitleCase(activePatientName)}</p>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {msgs.map((m: any) => {
                  const isDoctor = (m.senderType ?? m.sender_type) === 'doctor';
                  return (
                    <div key={m.id} className={cn('flex', isDoctor ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[70%] px-4 py-2.5 rounded-2xl text-sm',
                        isDoctor ? 'bg-lilac text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md')}>
                        {m.content}
                        <p className={cn('text-[10px] mt-1', isDoctor ? 'text-white/60' : 'text-gray-400')}>
                          {new Date(m.createdAt ?? m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="px-4 py-3 border-t">
                <form onSubmit={(e) => { e.preventDefault(); if (newMsg.trim()) sendMut.mutate(); }} className="flex gap-2">
                  <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Digite sua mensagem..." className="flex-1 px-4 py-2.5 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30" />
                  <button type="submit" disabled={!newMsg.trim() || sendMut.isPending}
                    className="p-2.5 bg-lilac text-white rounded-full hover:bg-primary-dark disabled:opacity-50">
                    {sendMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
