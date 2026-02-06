export type NavigationItem = {
  id: string;
  label: string;
  path: string;
  icon: string;
  description: string;
  gradient: string;
  section: string;
  showInSidebar?: boolean;
};

export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: '🏠',
    description: 'Visao geral do sistema',
    gradient: 'from-blue-500 to-blue-600',
    section: 'Principal',
    showInSidebar: true,
  },
  {
    id: 'students',
    label: 'Alunos',
    path: '/students',
    icon: '🏊‍♂️',
    description: 'Gerenciar alunos',
    gradient: 'from-green-500 to-teal-600',
    section: 'Gestao',
    showInSidebar: true,
  },
  {
    id: 'professors',
    label: 'Professores',
    path: '/professors',
    icon: '👨‍🏫',
    description: 'Gerenciar professores',
    gradient: 'from-teal-500 to-emerald-600',
    section: 'Gestao',
    showInSidebar: true,
  },
  {
    id: 'classes',
    label: 'Turmas',
    path: '/classes',
    icon: '👥',
    description: 'Gerenciar turmas',
    gradient: 'from-blue-500 to-blue-600',
    section: 'Operacoes',
    showInSidebar: true,
  },
  {
    id: 'pools',
    label: 'Piscinas',
    path: '/pools',
    icon: '🏊‍♀️',
    description: 'Gerenciar piscinas',
    gradient: 'from-teal-500 to-cyan-600',
    section: 'Operacoes',
    showInSidebar: true,
  },
  {
    id: 'trainings',
    label: 'Treinos',
    path: '/trainings',
    icon: '💪',
    description: 'Registrar treinos',
    gradient: 'from-orange-500 to-amber-500',
    section: 'Atividades',
    showInSidebar: true,
  },
  {
    id: 'evaluations',
    label: 'Avaliacoes',
    path: '/evaluations',
    icon: '📊',
    description: 'Sistema de avaliacoes',
    gradient: 'from-rose-500 to-red-500',
    section: 'Atividades',
    showInSidebar: true,
  },
  {
    id: 'profile',
    label: 'Perfil',
    path: '/profile',
    icon: '👤',
    description: 'Dados da conta',
    gradient: 'from-slate-500 to-slate-600',
    section: 'Conta',
    showInSidebar: false,
  },
];

export const breadcrumbMap = new Map(
  navigationItems.map(item => [item.path, item.label])
);

export const sidebarSections = [
  'Principal',
  'Gestao',
  'Operacoes',
  'Atividades',
];
