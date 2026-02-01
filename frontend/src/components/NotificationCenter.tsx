import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { useNotifications } from '../contexts/NotificationContext';
import { Toast } from './Toast';

export const NotificationCenter: React.FC = () => {
  const { notifications } = useNotifications();

  // Create portal to render notifications at the top level
  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <Toast notification={notification} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};