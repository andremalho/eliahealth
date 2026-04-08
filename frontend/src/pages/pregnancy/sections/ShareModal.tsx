import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Loader2, Copy, Check, Share2 } from 'lucide-react';
import { generateShareQrCode } from '../../../api/pregnancy.api';

interface Props {
  pregnancyId: string;
  patientName: string;
  onClose: () => void;
}

export default function ShareModal({ pregnancyId, patientName, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => generateShareQrCode(pregnancyId),
  });

  const generate = () => mutation.mutate();

  const data = mutation.data;
  const shareUrl = data ? `https://app.eliahealth.com/cartao?token=${data.accessToken}` : '';

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-lilac" />
            <h2 className="text-lg font-semibold text-navy">Compartilhar cartão</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Gere um link único e seguro para compartilhar o cartão de <strong>{patientName}</strong>.
            O link tem validade de 24 horas.
          </p>

          {!data && !mutation.isPending && (
            <button
              onClick={generate}
              className="w-full py-3 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
            >
              Gerar link de compartilhamento
            </button>
          )}

          {mutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-lilac animate-spin" />
            </div>
          )}

          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao gerar link de compartilhamento.
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={data.qrcodeUrl}
                  alt="QR Code"
                  className="w-48 h-48 border border-gray-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 bg-gray-50"
                  />
                  <button
                    onClick={copy}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Copiar"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 text-center">
                Expira em: {new Date(data.expiresAt).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
