import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare,
  Maximize2, Minimize2, Loader2, Heart,
} from 'lucide-react';
import DailyIframe from '@daily-co/daily-js';
import { toast } from 'sonner';
import { fetchSession, startCall, endCall } from '../../api/telemedicine.api';
import { cn } from '../../utils/cn';

export default function VideoCallPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<any>(null);
  const [joined, setJoined] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ['telemed-session', sessionId],
    queryFn: () => fetchSession(sessionId!),
    enabled: !!sessionId,
  });

  const startMut = useMutation({ mutationFn: () => startCall(sessionId!) });
  const endMut = useMutation({
    mutationFn: () => endCall(sessionId!, notes || undefined),
    onSuccess: () => {
      toast.success('Consulta encerrada');
      navigate(-1);
    },
  });

  const joinCall = useCallback(async () => {
    if (!session?.roomUrl || !containerRef.current || callRef.current) return;

    const daily = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '12px',
      },
      showLeaveButton: false,
      showFullscreenButton: false,
    });

    callRef.current = daily;

    daily.on('joined-meeting', () => {
      setJoined(true);
      startMut.mutate();
    });

    daily.on('left-meeting', () => setJoined(false));

    try {
      await daily.join({
        url: session.roomUrl,
        token: session.doctorToken ?? undefined,
      });
    } catch (err) {
      toast.error('Falha ao conectar a chamada');
    }
  }, [session, startMut]);

  useEffect(() => {
    return () => {
      if (callRef.current) {
        callRef.current.destroy();
        callRef.current = null;
      }
    };
  }, []);

  const toggleVideo = () => {
    if (callRef.current) {
      callRef.current.setLocalVideo(!videoOn);
      setVideoOn(!videoOn);
    }
  };

  const toggleAudio = () => {
    if (callRef.current) {
      callRef.current.setLocalAudio(!audioOn);
      setAudioOn(!audioOn);
    }
  };

  const handleEnd = () => {
    if (callRef.current) {
      callRef.current.leave();
      callRef.current.destroy();
      callRef.current = null;
    }
    endMut.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-lilac" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col bg-gray-900 text-white', fullscreen ? 'fixed inset-0 z-50' : 'min-h-screen')}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-lilac" fill="currentColor" />
          <span className="font-semibold">EliaHealth</span>
          <span className="text-xs text-gray-400 ml-2">Teleconsulta</span>
        </div>
        <div className="flex items-center gap-3">
          {joined && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400">Ao vivo</span>
            </div>
          )}
          <span className="text-sm text-gray-400">
            {session?.patient?.fullName ?? 'Paciente'}
          </span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative">
        {!joined ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-navy flex items-center justify-center mb-6">
              <Video className="w-10 h-10 text-lilac" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Pronto para iniciar?</h2>
            <p className="text-sm text-gray-400 mb-6">
              {session?.patient?.fullName ?? 'Paciente'} esta aguardando
            </p>
            <button onClick={joinCall}
              className="px-8 py-3 bg-lilac text-white font-medium rounded-xl hover:bg-primary-dark transition flex items-center gap-2">
              <Video className="w-5 h-5" /> Entrar na consulta
            </button>
          </div>
        ) : (
          <div ref={containerRef} className="absolute inset-0" />
        )}

        {/* Notes panel */}
        {showNotes && joined && (
          <div className="absolute right-4 top-4 w-80 bg-gray-800/95 backdrop-blur rounded-xl shadow-2xl p-4">
            <p className="text-xs font-medium text-gray-400 mb-2">Anotacoes da consulta</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Registrar observacoes durante a consulta..."
              className="w-full h-40 bg-gray-700 text-white text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-lilac/30"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      {joined && (
        <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-900/80 backdrop-blur">
          <button onClick={toggleAudio}
            className={cn('p-3 rounded-full transition', audioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600')}>
            {audioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button onClick={toggleVideo}
            className={cn('p-3 rounded-full transition', videoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600')}>
            {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <button onClick={() => setShowNotes(!showNotes)}
            className={cn('p-3 rounded-full transition', showNotes ? 'bg-lilac' : 'bg-gray-700 hover:bg-gray-600')}>
            <MessageSquare className="w-5 h-5" />
          </button>
          <button onClick={() => setFullscreen(!fullscreen)}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition">
            {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={handleEnd}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-full transition flex items-center gap-2 ml-4">
            <PhoneOff className="w-5 h-5" /> Encerrar
          </button>
        </div>
      )}
    </div>
  );
}
