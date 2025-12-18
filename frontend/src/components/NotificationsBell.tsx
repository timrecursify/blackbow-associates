import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Check, Loader2, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../services/api';
import { logger } from '../utils/logger';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
};

function formatTime(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const NotificationsBell: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  const badgeText = useMemo(() => {
    if (unreadCount <= 0) return null;
    if (unreadCount > 99) return '99+';
    return String(unreadCount);
  }, [unreadCount]);

  const fetchUnreadCount = async () => {
    if (!enabled) return;
    try {
      const res = await notificationsAPI.unreadCount();
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch (err) {
      logger.debug('Failed to fetch unread notifications count');
    }
  };

  const fetchItems = async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const res = await notificationsAPI.list(1, 20, false);
      setItems(res.data?.notifications ?? []);
    } catch (err) {
      logger.error('Failed to fetch notifications', err as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    if (!enabled) return;

    const id = window.setInterval(() => {
      fetchUnreadCount();
    }, 45000);

    return () => window.clearInterval(id);
  }, [enabled]);

  useEffect(() => {
    if (!open) return;
    fetchItems();
    fetchUnreadCount();
  }, [open]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  const markAllRead = async () => {
    if (!enabled) return;
    try {
      await notificationsAPI.markAllRead();
      await fetchUnreadCount();
      await fetchItems();
    } catch (err) {
      logger.error('Failed to mark all notifications read', err as any);
    }
  };

  const onClickItem = async (n: NotificationItem) => {
    try {
      if (!n.readAt) {
        await notificationsAPI.markRead(n.id);
        await fetchUnreadCount();
      }
    } catch (err) {
      // non-blocking
    }

    setOpen(false);
    if (n.linkUrl) navigate(n.linkUrl);
  };

  const dismiss = async (id: string) => {
    try {
      await notificationsAPI.dismiss(id);
      setItems(prev => prev.filter(n => n.id !== id));
      await fetchUnreadCount();
    } catch (err) {
      logger.error('Failed to dismiss notification', err as any);
    }
  };

  if (!enabled) return null;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-gray-700" />
        {badgeText && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
            {badgeText}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[92vw] max-w-[380px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-900">Notifications</p>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={markAllRead}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Close"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="py-10 text-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                <p className="text-sm mt-2">Loading…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => onClickItem(n)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${n.readAt ? 'text-gray-800' : 'text-black'}`}>
                            {n.title}
                          </p>
                          {!n.readAt && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                              <Check size={12} /> New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.body}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => dismiss(n.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Dismiss"
                      >
                        <X size={14} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


