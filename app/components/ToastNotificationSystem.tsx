import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { X, MessageCircle, FileText, Mic, CheckCircle, Clock, MessageSquareCodeIcon } from 'lucide-react';

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
        return <MessageSquareCodeIcon className="w-5 h-5 text-orange-500" />;
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

  const truncateContent = (content: string, maxLength: number = 80) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 mb-3 w-full max-w-sm sm:max-w-md transform transition-all duration-300 ease-out animate-slideIn backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              {getTypeLabel()}
            </span>
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatTime(toast.createdAt)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onClose(toast.id, toast.messageId)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 group flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
        </button>
      </div>

      <div className="flex items-center mb-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0">
          {toast.senderName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {toast.senderName}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {toast.senderName} sent you a {toast.type === 'task' ? 'task' : toast.type === 'voice' ? 'voice message' : toast.type === 'file' ? 'file' : 'message'}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
        {toast.type === 'voice' && toast.duration ? (
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Voice message</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Duration: {formatDuration(toast.duration)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
            {truncateContent(toast.content)}
          </p>
        )}
      </div>

      {toast.type === 'file' && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
          <FileText className="w-3 h-3" />
          <span>File attachment included</span>
        </div>
      )}
      
      {toast.type === 'task' && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400">
          <CheckCircle className="w-3 h-3" />
          <span>Task requires your attention</span>
        </div>
      )}
      {toast.type === 'discussion' && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400">
          <MessageSquareCodeIcon className="w-3 h-3" />
          <span>New discussion created by {toast.senderName}</span>
        </div>
      )}
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; onRemoveToast: (id: string, messageId?: number) => void }> = ({ 
  toasts, 
  onRemoveToast 
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse space-y-reverse space-y-2 max-h-screen overflow-hidden">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onClose={onRemoveToast}
        />
      ))}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

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
      const raw = localStorage.getItem(todayKey);
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
      localStorage.setItem(todayKey, JSON.stringify(Array.from(dismissedIds)));
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
    
    setToasts(prev => [...prev, newToast]);
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

  return (
    <ToastContext.Provider value={{ addToast, removeToast, removeToastPersist }}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToastPersist} />
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
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
      const raw = localStorage.getItem(key);
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
