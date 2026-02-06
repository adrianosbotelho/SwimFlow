import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { breadcrumbMap } from '../config/navigation';

const getCrumbLabel = (path: string) => {
  return breadcrumbMap.get(path) || 'Pagina';
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium text-gray-900 dark:text-gray-100">Dashboard</span>
      </div>
    );
  }

  const crumbs = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    return {
      path,
      label: getCrumbLabel(path),
      isLast: index === segments.length - 1,
    };
  });

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        Dashboard
      </Link>
      {crumbs.map(crumb => (
        <React.Fragment key={crumb.path}>
          <span className="text-gray-400">/</span>
          {crumb.isLast ? (
            <span className="font-medium text-gray-900 dark:text-gray-100">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
