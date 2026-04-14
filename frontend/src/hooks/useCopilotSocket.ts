import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface CopilotInsightData {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  suggestedAction: string | null;
  guidelineReference: string | null;
  triggeredBy: string;
}

interface UseCopilotSocketOptions {
  consultationId: string;
  patientId: string;
  enabled?: boolean;
}

export function useCopilotSocket({ consultationId, patientId, enabled = true }: UseCopilotSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [insights, setInsights] = useState<CopilotInsightData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !consultationId) return;

    const token = localStorage.getItem('elia_token');
    if (!token) return;

    const socket = io(`${API_URL}/copilot`, {
      query: { consultationId, patientId, token },
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('copilot:insights', (data: { insights: CopilotInsightData[] }) => {
      setInsights((prev) => [...data.insights, ...prev]);
      setLoading(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [consultationId, patientId, enabled]);

  const emitFieldUpdate = useCallback(
    (trigger: string, field: string, value: unknown, currentFormState: Record<string, unknown>) => {
      if (!socketRef.current?.connected) return;
      setLoading(true);
      socketRef.current.emit('consultation:field_updated', {
        trigger,
        field,
        value,
        currentFormState,
      });
      // Auto-clear loading after timeout if no response
      setTimeout(() => setLoading(false), 5000);
    },
    [],
  );

  const requestFullAnalysis = useCallback(() => {
    if (!socketRef.current?.connected) return;
    setLoading(true);
    socketRef.current.emit('consultation:request_analysis');
  }, []);

  const recordAction = useCallback(
    (insightId: string, action: 'accepted' | 'dismissed', note?: string) => {
      socketRef.current?.emit('copilot:insight_action', { insightId, action, note });
      setInsights((prev) => prev.filter((i) => i.id !== insightId));
    },
    [],
  );

  return { connected, insights, loading, emitFieldUpdate, requestFullAnalysis, recordAction };
}
