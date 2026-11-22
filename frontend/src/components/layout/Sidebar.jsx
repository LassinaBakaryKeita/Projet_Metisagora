import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Bell, LogOut, ShieldCheck, X } from 'lucide-react';
import { MetisagoraIcon } from '../ui/MetisagoraIcon';
import { NotificationBadge } from '../ui/NotificationBadge';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { unreadCount } = useNotifications();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Tableau de bord',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Produits',
      path: '/admin/products',
      icon: Package,
      badge: null,
    },
    {
      name: 'Notifications',
      path: '/admin/notifications',
      icon: Bell,
      badge: unreadCount,
    },
  ];

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#030303]/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Conteneur Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0E1011] border-r border-[#252629] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Marque */}
        <div className="h-18 flex items-center justify-between px-6 border-b border-[#252629]/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#13F2F8]/10 border border-[#13F2F8]/30 flex items-center justify-center text-[#13F2F8] shadow-[0_0_15px_rgba(19,242,248,0.2)]">
              <MetisagoraIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
                Métisagora
              </span>
              <p className="text-[11px] text-white/40 font-medium">Commerce & IA Conseil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/40 hover:text-white rounded-lg lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Éléments de navigation (Strictement Dashboard, Produits, Notifications) */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
            Gestion
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-[#13F2F8]/10 text-[#13F2F8] border border-[#13F2F8]/20 shadow-[0_0_12px_rgba(19,242,248,0.1)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-105" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== null && item.badge > 0 && (
                  <NotificationBadge count={item.badge} />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Profil utilisateur & Déconnexion */}
        <div className="p-4 border-t border-[#252629]/70 bg-[#0B0F10]/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || 'Admin Boutique'}
              </p>
              <p className="text-[11px] text-white/40 truncate">
                {user?.email || 'admin@business.com'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400/80 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 rounded-xl transition-colors border border-rose-500/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};
