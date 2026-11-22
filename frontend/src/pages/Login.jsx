
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { MetisagoraIcon } from '../components/ui/MetisagoraIcon';

import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);

      navigate(from, { replace: true });

    } catch (err) {
      setError(
        err.message || 'Identifiants incorrects. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F10] flex flex-col justify-center items-center p-4 relative overflow-hidden">

      {/* Halos lumineux */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#13F2F8]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Carte de connexion */}
      <div className="w-full max-w-md bg-[#121313] border border-[#252629] rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-xl">

        {/* Logo et en-tête */}
        <div className="text-center mb-8">

          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#13F2F8]/10 border border-[#13F2F8]/30 flex items-center justify-center text-[#13F2F8] shadow-[0_0_25px_rgba(19,242,248,0.25)] mb-4">
            <MetisagoraIcon className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            Métisagora
          </h2>

          <p className="text-sm text-white/50 mt-1">
            Portail Administrateur & Commerce Intelligent
          </p>

        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>

            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5">
              Adresse Email
            </label>

            <div className="relative">

              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Mail className="w-4 h-4" />
              </div>

              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@business.com"
                className="w-full bg-[#1A1F1F] border border-[#252629] focus:border-[#13F2F8] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
              />

            </div>
          </div>

          {/* Mot de passe */}
          <div>

            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5">
              Mot de passe
            </label>

            <div className="relative">

              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Lock className="w-4 h-4" />
              </div>

              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1A1F1F] border border-[#252629] focus:border-[#13F2F8] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
              />

            </div>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#13F2F8] hover:bg-[#279DA1] text-[#0B0F10] font-semibold text-sm transition-all shadow-[0_0_20px_rgba(19,242,248,0.25)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >

            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}

          </button>

        </form>

        {/* Pied de carte */}
        <div className="mt-8 pt-6 border-t border-[#252629]/70 text-center">

          <p className="text-xs text-white/40">
            Accès réservé aux administrateurs autorisés.
          </p>

        </div>

      </div>
    </div>
  );
};
