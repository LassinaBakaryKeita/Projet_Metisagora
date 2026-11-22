import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

export const Header = ({ onOpenSidebar, title, subtitle }) => {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-18 bg-[#0B0F10]/80 backdrop-blur-md border-b border-[#252629]/70 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Déclencheur menu mobile */}
        <button
          onClick={onOpenSidebar}
          className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/5 lg:hidden border border-white/5 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-white/40 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Cloche de notifications */}
        <button
          onClick={() => navigate('/admin/notifications')}
          className="relative p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/5 transition-colors border border-white/5 cursor-pointer"
          title="Consulter les notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#13F2F8] text-[10px] font-bold text-[#0B0F10]">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
