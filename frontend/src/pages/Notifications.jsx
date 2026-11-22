
import React, { useState, useEffect, useCallback } from 'react';

import {
  CheckCircle2,
  Phone,
  Calendar,
  RotateCcw,
  User,
  Eye,
  CheckCheck
} from 'lucide-react';

import { notificationService } from '../services/notificationService';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';


export const Notifications = () => {

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [filter, setFilter] = useState('all');

  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);


  // Chargement des notifications depuis FastAPI
  const loadNotifications = useCallback(async () => {

    try {
      setLoading(true);
      setError('');

      const data = await notificationService.getNotifications();

      setNotifications(data);

    } catch (err) {
      console.error(
        'Erreur lors du chargement des notifications :',
        err
      );

      setError(err.message);

    } finally {
      setLoading(false);
    }

  }, []);


  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);


  // Marquer une notification comme résolue
  const handleResolve = async (id, e) => {

    if (e) e.stopPropagation();

    try {
      setActionLoading(true);
      setError('');

      await notificationService.resolveNotification(id);

      if (selectedNotif?.id === id) {
        setSelectedNotif(null);
      }

      await loadNotifications();

    } catch (err) {
      console.error('Erreur lors de la résolution :', err);
      setError(err.message);

    } finally {
      setActionLoading(false);
    }
  };


  // Rouvrir une notification
  const handleReopen = async (id, e) => {

    if (e) e.stopPropagation();

    try {
      setActionLoading(true);
      setError('');

      await notificationService.reopenNotification(id);

      if (selectedNotif?.id === id) {
        setSelectedNotif(null);
      }

      await loadNotifications();

    } catch (err) {
      console.error('Erreur lors de la réouverture :', err);
      setError(err.message);

    } finally {
      setActionLoading(false);
    }
  };


  // Examiner une notification
  const handleView = async (notif) => {

    setSelectedNotif(notif);

    if (!notif.isRead) {

      try {
        const updatedNotif = await notificationService.markAsRead(notif.id);

        setSelectedNotif(updatedNotif);

        await loadNotifications();

      } catch (err) {
        console.error(
          'Erreur lors du marquage comme lu :',
          err
        );

        setError(err.message);
      }
    }
  };


  // Filtrage des notifications
  const filteredNotifs = notifications.filter((n) => {

    if (filter === 'pending') {
      return n.status === 'pending';
    }

    if (filter === 'resolved') {
      return n.status === 'resolved';
    }

    return true;
  });


  // Compteurs
  const pendingCount = notifications.filter(
    (n) => n.status === 'pending'
  ).length;

  const resolvedCount = notifications.length - pendingCount;


  if (loading) {
    return (
      <LoadingSpinner
        text="Chargement des demandes d'intervention chatbot..."
      />
    );
  }


  return (

    <div className="space-y-6">

      {/* En-tête & Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">

            <span>File d'Intervention Humaine</span>

            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#13F2F8] text-[#0B0F10]">
                {pendingCount} En attente
              </span>
            )}

          </h2>

          <p className="text-xs text-white/40 mt-1">
            Conversations WhatsApp nécessitant l'assistance d'un agent quand l'IA ne peut répondre au client
          </p>
        </div>


        {/* Filtres */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121313] border border-[#252629] rounded-xl self-start sm:self-auto">

          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filter === 'all'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-white/50 hover:text-white'
              }`}
          >
            Toutes ({notifications.length})
          </button>


          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filter === 'pending'
              ? 'bg-[#13F2F8]/10 text-[#13F2F8] font-semibold border border-[#13F2F8]/20'
              : 'text-white/50 hover:text-white'
              }`}
          >
            En attente ({pendingCount})
          </button>


          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filter === 'resolved'
              ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
              : 'text-white/50 hover:text-white'
              }`}
          >
            Résolues ({resolvedCount})
          </button>

        </div>

      </div>


      {/* Message d'erreur */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-3">

          <span>{error}</span>

          <button
            onClick={loadNotifications}
            className="underline font-semibold shrink-0"
          >
            Réessayer
          </button>

        </div>
      )}


      {/* Liste des notifications */}
      <div className="space-y-3">

        {filteredNotifs.length === 0 ? (

          <div className="py-16 text-center bg-[#121313] border border-[#252629] rounded-2xl">

            <CheckCheck className="w-10 h-10 mx-auto text-emerald-400/60 mb-3" />

            <h3 className="text-sm font-semibold text-white">
              {notifications.length === 0
                ? 'Aucune notification pour le moment'
                : 'File d’attente vide !'}
            </h3>

            <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">

              {notifications.length === 0
                ? 'Les demandes d’intervention du chatbot apparaîtront ici.'
                : 'Aucune notification ne correspond à ce filtre.'}

            </p>

          </div>

        ) : (

          filteredNotifs.map((notif) => {

            const isPending = notif.status === 'pending';

            return (

              <div
                key={notif.id}
                onClick={() => handleView(notif)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 ${isPending
                  ? 'bg-[#121313] border-[#252629] hover:border-[#13F2F8]/40 shadow-sm'
                  : 'bg-[#121313]/50 border-[#252629]/50 opacity-75 hover:opacity-100'
                  } ${!notif.isRead
                    ? 'border-l-4 border-l-[#13F2F8]'
                    : ''
                  }`}
              >

                {/* Informations client */}
                <div className="space-y-2 flex-1 min-w-0">

                  <div className="flex flex-wrap items-center gap-2.5">

                    <span className="font-semibold text-white text-sm flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-white/40" />
                      {notif.customerName}
                    </span>


                    <span className="text-xs font-mono text-white/40 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {notif.customerPhone}
                    </span>


                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${notif.priority === 'high'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : notif.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-white/5 text-white/60 border border-white/10'
                        }`}
                    >
                      {notif.reason}
                    </span>


                    {!notif.isRead && (
                      <span
                        className="w-2 h-2 rounded-full bg-[#13F2F8] animate-pulse"
                        title="Non lu"
                      />
                    )}

                  </div>


                  <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                    « {notif.message} »
                  </p>


                  <div className="flex items-center gap-3 text-[11px] text-white/40">

                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {notif.timestamp}
                    </span>

                    <span>•</span>

                    <span>
                      Statut :{' '}

                      <strong
                        className={
                          isPending
                            ? 'text-amber-300 font-medium'
                            : 'text-emerald-400 font-medium'
                        }
                      >
                        {isPending ? 'En attente' : 'Résolue'}
                      </strong>

                    </span>

                  </div>

                </div>


                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#252629]/50">

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(notif);
                    }}
                    className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/5 transition-colors border border-white/5 text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Examiner</span>
                  </button>


                  {isPending ? (

                    <button
                      disabled={actionLoading}
                      onClick={(e) => handleResolve(notif.id, e)}
                      className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marquer Résolue</span>
                    </button>

                  ) : (

                    <button
                      disabled={actionLoading}
                      onClick={(e) => handleReopen(notif.id, e)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rouvrir</span>
                    </button>

                  )}

                </div>

              </div>

            );
          })

        )}

      </div>


      {/* Modal Détails */}
      <Modal
        isOpen={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
        title="Escalade Conversation WhatsApp"
        subtitle="Contexte complet et détails de l'interaction client avec l'IA"
      >

        {selectedNotif && (

          <div className="space-y-4">

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">

              <div className="flex items-center justify-between border-b border-[#252629]/60 pb-3">

                <div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Client
                  </span>

                  <p className="text-sm font-semibold text-white">
                    {selectedNotif.customerName}
                  </p>

                  <p className="text-xs font-mono text-white/50">
                    {selectedNotif.customerPhone}
                  </p>

                </div>


                <div className="text-right">

                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Motif
                  </span>

                  <p className="text-xs font-medium text-[#13F2F8]">
                    {selectedNotif.reason}
                  </p>

                  <p className="text-[11px] text-white/40">
                    {selectedNotif.date}
                  </p>

                </div>

              </div>


              <div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Message du client au chatbot :
                </span>

                <div className="mt-1.5 p-3 rounded-lg bg-[#0B0F10] border border-[#252629] text-xs text-white/80 leading-relaxed italic">
                  « {selectedNotif.message} »
                </div>

              </div>


              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400">

                <strong>Recommandation du Bot :</strong>{' '}

                Un agent humain doit contacter directement le client sur WhatsApp au {selectedNotif.customerPhone} pour finaliser son dossier.

              </div>

            </div>


            {/* Actions de la modal */}
            <div className="flex items-center justify-between pt-2">

              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors cursor-pointer"
              >
                Fermer
              </button>


              {selectedNotif.status === 'pending' ? (

                <button
                  disabled={actionLoading}
                  onClick={() => handleResolve(selectedNotif.id)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-[#0B0F10] hover:bg-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marquer comme Résolue</span>
                </button>

              ) : (

                <button
                  disabled={actionLoading}
                  onClick={() => handleReopen(selectedNotif.id)}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Rouvrir le dossier
                </button>

              )}

            </div>

          </div>

        )}

      </Modal>

    </div>
  );
};
