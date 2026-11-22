
import React, { useState, useEffect } from 'react';
import {
  Package,
  Boxes,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  MessageSquare,
  Zap,
  Clock,
  CheckCircle2,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { StatisticsCard } from '../components/ui/StatisticsCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = await dashboardService.getStats();
      setData(stats);
    } catch (err) {
      console.error('Erreur lors du chargement du Dashboard :', err);
      setError(
        "Impossible de charger les statistiques. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <LoadingSpinner text="Chargement des statistiques du Dashboard..." />
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#121313] border border-[#252629] rounded-2xl p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />

        <h2 className="text-white font-semibold">
          Une erreur est survenue
        </h2>

        <p className="text-sm text-white/50 mt-2">
          {error || "Les données du Dashboard sont indisponibles."}
        </p>

        <button
          onClick={fetchDashboard}
          className="mt-5 px-5 py-2.5 rounded-xl bg-[#13F2F8] text-[#0B0F10] text-sm font-semibold hover:bg-[#279DA1] transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const { metrics, trends, lowStockProducts, weeklyActivity } = data;

  const maxDailyConvs = weeklyActivity?.days?.length
    ? Math.max(...weeklyActivity.days.map((d) => d.conversations), 1)
    : 1;

  const totalResolved = weeklyActivity?.days
    ? weeklyActivity.days.reduce((acc, d) => acc + d.resolvedByAi, 0)
    : 0;

  const totalEscalated = weeklyActivity?.days
    ? weeklyActivity.days.reduce((acc, d) => acc + d.escalated, 0)
    : 0;

  return (
    <div className="space-y-8">

      {/* Bannière principale */}
      <div className="relative overflow-hidden rounded-3xl bg-[#121313] border border-[#252629] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#13F2F8]/10 border border-[#13F2F8]/20 text-[#13F2F8] text-xs font-semibold mb-3">
            <Bot className="w-3.5 h-3.5" />
            <span>Tableau de bord administrateur</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Vue d'ensemble du commerce
          </h2>

          <p className="text-sm text-white/50 mt-1.5 max-w-xl leading-relaxed">
            Consultez les indicateurs de votre catalogue et
            suivez les demandes nécessitant une intervention humaine.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/admin/products')}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-colors"
          >
            Gérer le Catalogue
          </button>

          <button
            onClick={() => navigate('/admin/notifications')}
            className="px-4 py-2.5 rounded-xl bg-[#13F2F8] hover:bg-[#279DA1] text-[#0B0F10] text-xs font-semibold transition-colors"
          >
            Demandes en attente ({metrics.pendingEscalations})
          </button>
        </div>

        <div className="absolute top-0 right-0 w-80 h-80 bg-[#13F2F8]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        <StatisticsCard
          title="Total Produits"
          value={metrics.totalProducts}
          subtitle="Articles au catalogue"
          icon={Package}
          trend="Données en direct"
          trendType="neutral"
        />

        <StatisticsCard
          title="Stock Total"
          value={metrics.totalStock}
          subtitle={trends.stockHealth}
          icon={Boxes}
          trend="Comptage en direct"
          trendType="positive"
        />
      </div>

      {/* Zone analytique */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Activité WhatsApp & Chatbot */}
        <div className="lg:col-span-2 bg-[#121313] border border-[#252629] rounded-2xl p-6 flex flex-col justify-between">

          {/* En-tête de la carte */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#252629]/60 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">
                  Activité Hebdomadaire
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  En direct
                </span>
              </div>
              <p className="text-xs text-white/40 mt-0.5">
                Échanges clients traités via WhatsApp Cloud API & IA
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-white/60">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#13F2F8]" />
                <span>IA Autonome</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/60">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span>Escaladées</span>
              </div>
            </div>
          </div>

          {/* Indicateurs clés de performance (Micro-KPIs) */}
          <div className="grid grid-cols-3 gap-3 my-5">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-white/40 text-[11px] font-medium mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#13F2F8]" />
                <span>Total Conversations</span>
              </div>
              <p className="text-xl font-bold text-white tracking-tight">
                {weeklyActivity?.totalConversations ?? 0}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                Sur les 7 derniers jours
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-white/40 text-[11px] font-medium mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Résolution Autonome</span>
              </div>
              <p className="text-xl font-bold text-emerald-400 tracking-tight">
                {weeklyActivity?.aiResolutionRate ?? 95}%
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                Traitées 100% par l'IA
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-white/40 text-[11px] font-medium mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Temps de Réponse</span>
              </div>
              <p className="text-xl font-bold text-white tracking-tight">
                {weeklyActivity?.avgResponseTime ?? '1.4s'}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                Délai moyen de génération
              </p>
            </div>
          </div>

          {/* Graphique en barres de l'activité sur 7 jours */}
          <div className="py-4">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {weeklyActivity?.days?.map((dayItem, idx) => {
                const heightPercent = Math.max(
                  Math.round((dayItem.conversations / maxDailyConvs) * 100),
                  16
                );

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group"
                  >
                    {/* Chiffre au-dessus de la barre */}
                    <span
                      className={`text-xs font-semibold mb-2 transition-colors ${
                        dayItem.isToday
                          ? 'text-[#13F2F8]'
                          : 'text-white/60 group-hover:text-white'
                      }`}
                    >
                      {dayItem.conversations}
                    </span>

                    {/* Conteneur de la barre */}
                    <div className="w-full max-w-[42px] h-32 bg-white/[0.03] rounded-t-lg relative flex items-end justify-center overflow-hidden border border-white/5">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all duration-500 ${
                          dayItem.isToday
                            ? 'bg-gradient-to-t from-[#13F2F8] to-[#279DA1] shadow-[0_0_12px_rgba(19,242,248,0.4)]'
                            : 'bg-white/15 group-hover:bg-[#13F2F8]/40'
                        }`}
                      />
                    </div>

                    {/* Jour & Date */}
                    <div className="text-center mt-2.5">
                      <p
                        className={`text-xs font-medium ${
                          dayItem.isToday
                            ? 'text-[#13F2F8] font-bold'
                            : 'text-white/70'
                        }`}
                      >
                        {dayItem.day}
                      </p>
                      <p className="text-[10px] text-white/30">{dayItem.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pied de carte avec statut en direct */}
          <div className="pt-4 border-t border-[#252629]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-white/50">
              <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Canal WhatsApp Business Cloud API synchronisé</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Chatbot IA Connecté & Opérationnel</span>
            </div>
          </div>
        </div>

        {/* Alertes de stock */}
        <div className="bg-[#121313] border border-[#252629] rounded-2xl p-6 flex flex-col">

          <div className="flex items-center justify-between pb-4 border-b border-[#252629]/60">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />

              <h3 className="text-base font-semibold text-white">
                Alertes de Stock
              </h3>
            </div>

            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {lowStockProducts.length} articles
            </span>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto">

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-white/40 py-6 text-center">
                Aucun produit en stock faible.
              </p>
            ) : (
              lowStockProducts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-white truncate">
                      {item.name}
                    </p>

                    <p className="text-[11px] text-white/40">
                      {item.price.toLocaleString('fr-FR')} MAD
                    </p>
                  </div>

                  <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Plus que {item.stock}
                  </span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => navigate('/admin/products')}
            className="mt-4 w-full py-2.5 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5 flex items-center justify-center gap-1.5"
          >
            <span>Gérer les produits</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
