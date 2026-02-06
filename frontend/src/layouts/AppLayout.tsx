import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { NavigationHeader } from '../components/NavigationHeader';
import { Sidebar } from '../components/Sidebar';

interface AppLayoutProps {
  onLogout?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 text-gray-900 dark:text-gray-100">
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 min-h-screen lg:ml-72">
          <NavigationHeader onToggleSidebar={() => setIsSidebarOpen(true)} onLogout={onLogout} />
          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
