import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
  showCloseButton = true,
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={clsx(
              'relative w-full bg-white rounded-2xl shadow-float flex flex-col max-h-[90vh]',
              'dark:bg-surface-900 dark:border dark:border-surface-800',
              sizeClasses[size],
              className
            )}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-surface-100 dark:border-surface-800 shrink-0">
                <div>
                  {title && <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">{title}</h2>}
                  {description && <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{description}</p>}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="shrink-0 p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100 dark:border-surface-800 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
};

export default Modal;
