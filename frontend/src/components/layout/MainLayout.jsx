import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/admin/dashboard':
        return {
          title: 'Tableau de bord',
          subtitle: 'Indicateurs de performance en temps réel et ventes automatisées sur WhatsApp',
        };
      case '/admin/products':
        return {
          title: 'Catalogue Produits',
          subtitle: 'Gérez les articles d\'inventaire synchronisés avec l\'assistant IA WhatsApp',
        };
      case '/admin/notifications':
        return {
          title: 'Escalades & Notifications',
          subtitle: 'Demandes et réclamations clients nécessitant une intervention humaine',
        };
      default:
        return {
          title: 'Portail d\'administration',
          subtitle: 'Assistant Commercial WhatsApp IA',
        };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="min-h-screen bg-[#0B0F10] text-[#FAFAFA] flex">
      {/* Barre latérale */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Zone de contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          title={meta.title}
          subtitle={meta.subtitle}
        />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
