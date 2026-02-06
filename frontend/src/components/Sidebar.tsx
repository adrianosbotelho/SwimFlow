import React from 'react';
import { NavLink } from 'react-router-dom';
import { navigationItems, sidebarSections } from '../config/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const sectionLabelMap: Record<string, string> = {
  Principal: 'Principal',
  Gestao: 'Gestao',
  Operacoes: 'Operacoes',
  Atividades: 'Atividades',
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-white/20 dark:border-slate-800/60 shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-6 border-b border-white/20 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🌊</span>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">SwimFlow</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gestao inteligente</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/60"
                aria-label="Fechar menu"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {sidebarSections.map(section => (
              <div key={section}>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 px-2 mb-3">
                  {sectionLabelMap[section]}
                </p>
                <div className="space-y-2">
                  {navigationItems
                    .filter(item => item.section === section && item.showInSidebar)
                    .map(item => (
                      <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-slate-800/70'
                          }`
                        }
                        onClick={onClose}
                      >
                        {({ isActive }) => (
                          <>
                            <span className="text-xl">{item.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{item.label}</p>
                              <p
                                className={`text-xs ${
                                  isActive ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                                } group-hover:text-gray-600 dark:group-hover:text-gray-300`}
                              >
                                {item.description}
                              </p>
                            </div>
                            <svg
                              className={`w-4 h-4 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                      </NavLink>
                    ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="px-6 py-4 border-t border-white/20 dark:border-slate-800/60">
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistema operacional</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
