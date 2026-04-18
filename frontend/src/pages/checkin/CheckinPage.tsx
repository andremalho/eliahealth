import { useState } from 'react';
import { Check, Loader2, AlertCircle, Heart, QrCode } from 'lucide-react';
import api from '../../api/client';

export default function CheckinPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckin = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      await api.post(`/appointments/checkin/${token.trim().toUpperCase()}`);
      setResult('success');
    } catch (err: any) {
      setResult('error');
      setErrorMsg(err?.response?.data?.message ?? 'Código inválido ou check-in já realizado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-lilac/10 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-6 h-6 text-lilac" fill="currentColor" />
            <h1 className="text-2xl font-bold text-navy">eliahealth</h1>
          </div>
          <p className="text-sm text-gray-500">Check-in de chegada</p>
        </div>

        {result === 'success' ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-navy mb-2">Check-in confirmado!</h2>
            <p className="text-sm text-gray-500">Sua chegada foi registrada. Aguarde ser chamada.</p>
            <button onClick={() => { setResult(null); setToken(''); }}
              className="mt-6 px-6 py-2 text-sm text-lilac border border-lilac rounded-lg hover:bg-lilac/5">
              Novo check-in
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-center mb-6">
              <QrCode className="w-12 h-12 text-lilac/30" />
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">
              Digite o codigo de check-in recebido no agendamento
            </p>

            <input
              value={token}
              onChange={(e) => { setToken(e.target.value.toUpperCase()); setResult(null); }}
              placeholder="XXXXXXXX"
              maxLength={8}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg text-2xl text-center tracking-[0.3em] font-mono text-navy uppercase focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
              autoFocus
            />

            {result === 'error' && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600">{errorMsg}</p>
              </div>
            )}

            <button
              onClick={handleCheckin}
              disabled={loading || token.length < 4}
              className="w-full mt-4 py-3.5 bg-lilac text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirmar chegada
            </button>

            <p className="text-center text-[10px] text-gray-400 mt-4">
              O codigo foi enviado no momento do agendamento. Se não tem o codigo, procure a recepção.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
