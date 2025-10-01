import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { X, MessageCircle, FileText, Mic, CheckCircle, Clock, BellDot, Bell, MessageSquareCode } from 'lucide-react';

interface Toast {
  id: string;
  type: 'message' | 'file' | 'voice' | 'task' | 'discussion';
  senderName: string;
  content: string;
  createdAt: Date;
  duration?: number;
  messageId?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  removeToastPersist: (id: string, messageId?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastNotification: React.FC<{ toast: Toast; onClose: (id: string, messageId?: number) => void }> = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'file':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'voice':
        return <Mic className="w-5 h-5 text-purple-500" />;
      case 'task':
        return <CheckCircle className="w-5 h-5 text-orange-500" />;
      case 'discussion':
        return <MessageSquareCode className="w-5 h-5 text-indigo-500" />;
      default:
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (toast.type) {
      case 'message':
        return 'New Message';
      case 'file':
        return 'File Shared';
      case 'voice':
        return 'Voice Message';
      case 'task':
        return 'Task Assigned';
      case 'discussion':
        return 'New Discussion';
      default:
        return 'New Message';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const truncateContent = (content: string, maxLength: number = 60) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200 cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                {getTypeLabel()}
              </span>
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatTime(toast.createdAt)}</span>
              </div>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
              {toast.senderName}
            </h4>
            
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 mb-2">
              {toast.type === 'voice' && toast.duration ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    Voice message ({formatDuration(toast.duration)})
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-700 dark:text-gray-300 break-words">
                  {truncateContent(toast.content)}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(toast.id, toast.messageId);
          }}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200 flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
        </button>
      </div>
    </div>
  );
};

const FloatingNotificationMenu: React.FC<{ 
  toasts: Toast[]; 
  isOpen: boolean;
  onToggle: () => void;
  onRemoveToast: (id: string, messageId?: number) => void;
  onClearAll: () => void;
}> = ({ toasts, isOpen, onToggle, onRemoveToast, onClearAll }) => {
  const hasNotifications = toasts.length > 0;
  if (!hasNotifications) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 max-w-[calc(100vw-3rem)] mb-2 animate-slideUp">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellDot className="w-5 h-5 text-white" />
                <h3 className="text-white font-semibold">Notifications</h3>
                <span className="bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {toasts.length}
                </span>
              </div>
              {toasts.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-white text-xs hover:bg-white/20 px-3 py-1 rounded-full transition-colors duration-200"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {toasts.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No new notifications
                  </p>
                </div>
              ) : (
                toasts.map((toast) => (
                  <ToastNotification
                    key={toast.id}
                    toast={toast}
                    onClose={onRemoveToast}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onToggle}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
          isOpen 
            ? 'bg-gray-700 dark:bg-gray-600' 
            : 'bg-gradient-to-r from-blue-500 to-purple-500'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : hasNotifications ? (
          <div className="relative">
            <BellDot className="w-6 h-6 text-white animate-bounce" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {toasts.length > 9 ? '9+' : toasts.length}
            </span>
          </div>
        ) : (
          <Bell className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const getTodayKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `dismissedMessageIds:${y}-${m}-${day}`;
  };
  
  const [todayKey] = useState<string>(getTodayKey());
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(() => {
    try {
      const raw = window.localStorage?.getItem(todayKey);
      if (!raw) return new Set<number>();
      const arr = JSON.parse(raw) as number[];
      return new Set(arr);
    } catch {
      return new Set<number>();
    }
  });

  const processedMessageIds = useRef(new Set<number>());

  useEffect(() => {
    try {
      window.localStorage?.setItem(todayKey, JSON.stringify(Array.from(dismissedIds)));
    } catch {}
  }, [dismissedIds, todayKey]);

  const addToast = (toastData: Omit<Toast, 'id'>) => {
    if (toastData.messageId && processedMessageIds.current.has(toastData.messageId)) {
      return;
    }

    if (!toastData.senderName || !toastData.content) {
      console.warn('Toast data missing required fields:', toastData);
      return;
    }

    const newToast: Toast = {
      ...toastData,
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    if (toastData.messageId) {
      processedMessageIds.current.add(toastData.messageId);
    }
    
    setToasts(prev => [newToast, ...prev]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const removeToastPersist = (id: string, messageId?: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    if (typeof messageId === 'number') {
      setDismissedIds(prev => new Set(prev).add(messageId));
    }
  };

  const handleClearAll = () => {
    toasts.forEach(toast => {
      if (toast.messageId) {
        setDismissedIds(prev => new Set(prev).add(toast.messageId!));
      }
    });
    setToasts([]);
    setIsOpen(false);
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, removeToastPersist }}>
      {children}
      <FloatingNotificationMenu
        toasts={toasts}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        onRemoveToast={removeToastPersist}
        onClearAll={handleClearAll}
      />
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useMessageToast = (currentUser: any) => {
  const { addToast } = useToast();

  const showToastForMessage = (message: any, senderName: string) => {
    if (!message || !senderName) {
      console.warn('Invalid message or senderName provided to showToastForMessage');
      return;
    }

    if (message.receiverId !== currentUser?.userId) return;

    try {
      const d = new Date();
      const key = `dismissedMessageIds:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const raw = window.localStorage?.getItem(key);
      if (raw) {
        const ids = new Set<number>((JSON.parse(raw) as number[]).filter((n) => typeof n === 'number'));
        if (typeof message.id === 'number' && ids.has(message.id)) {
          return;
        }
      }
    } catch {}

    let toastType: Toast['type'] = 'message';
    let content = message.content || 'New message received';

    switch (message.messageType) {
      case 1:
        toastType = 'message';
        break;
      case 2:
        toastType = 'file';
        content = message.fileName || 'File attachment';
        break;
      case 3:
        toastType = 'voice';
        content = 'Voice message';
        break;
      case 4:
        toastType = 'task';
        content = message.taskTitle || message.content || 'New task assigned';
        break;
      case 5:
        toastType = 'discussion';
        content = message.title || 'New discussion created';
        break;
      default:
        toastType = 'message';
    }

    addToast({
      type: toastType,
      senderName: senderName.trim(),
      content: content,
      createdAt: new Date(message.createdAt || new Date()),
      duration: message.duration,
      messageId: typeof message.id === 'number' ? message.id : undefined,
    });
  };

  return { showToastForMessage };
};
