import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Êtes-vous sûr ?',
  message = 'Cette action est irréversible.',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  danger = true,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#030303]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#121313] border border-[#252629] rounded-2xl p-6 shadow-2xl z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${danger ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#13F2F8]/10 text-[#13F2F8] border border-[#13F2F8]/20'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">{title}</h4>
          </div>
        </div>
        <p className="mt-3 text-sm text-white/60 leading-relaxed">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
              danger
                ? 'bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-[#13F2F8] hover:bg-[#279DA1] text-[#0B0F10] font-semibold'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
