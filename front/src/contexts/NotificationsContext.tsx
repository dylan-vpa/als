import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { apiClient, NotificationOut } from "../services/api";
import { useAuth } from "./AuthContext";

interface NotificationsContextValue {
  notifications: NotificationOut[];
  unreadCount: number;
  loading: boolean;
  permission: NotificationPermission | "unsupported";
  refresh: () => Promise<void>;
  markAsRead: (ids?: number[]) => Promise<void>;
  requestPermission: () => Promise<NotificationPermission | "unsupported">;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const POLL_INTERVAL_MS = 30000;

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return "unsupported";
    }
    return Notification.permission;
  });
  const pollingRef = useRef<number | null>(null);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      setPermission("unsupported");
      return "unsupported" as const;
    }
    if (permission === "granted") {
      return permission;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (err) {
      console.error("No se pudo obtener permiso de notificaciones", err);
      setPermission(Notification.permission);
      return Notification.permission;
    }
  }, [permission]);

  const showBrowserNotifications = useCallback(
    (items: NotificationOut[]) => {
      if (typeof window === "undefined" || typeof Notification === "undefined") {
        return;
      }
      if (permission !== "granted") {
        return;
      }
      items.forEach((notification) => {
        try {
          new Notification(notification.title, {
            body: notification.message,
            tag: `notification-${notification.id}`
          });
        } catch (err) {
          console.warn("No se pudo mostrar la notificación del navegador", err);
        }
      });
    },
    [permission]
  );

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      knownIdsRef.current = new Set();
      initializedRef.current = false;
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.listNotifications();
      const items = response.items || [];
      if (!initializedRef.current) {
        initializedRef.current = true;
        knownIdsRef.current = new Set(items.map((item) => item.id));
        setNotifications(items);
        return;
      }
      const prevIds = knownIdsRef.current;
      const nextIds = new Set<number>();
      const newItems: NotificationOut[] = [];
      items.forEach((item) => {
        nextIds.add(item.id);
        if (!prevIds.has(item.id)) {
          newItems.push(item);
        }
      });
      knownIdsRef.current = nextIds;
      if (newItems.length > 0) {
        showBrowserNotifications(newItems.filter((item) => !item.read_at));
      }
      setNotifications(items);
    } catch (err) {
      console.error("Error al obtener notificaciones", err);
    } finally {
      setLoading(false);
    }
  }, [showBrowserNotifications, user]);

  useEffect(() => {
    if (!user) {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setNotifications([]);
      knownIdsRef.current = new Set();
      initializedRef.current = false;
      return;
    }

    refresh();

    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
    }
    pollingRef.current = window.setInterval(() => {
      refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [refresh, user]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const markAsRead = useCallback(
    async (ids?: number[]) => {
      if (!user) return;
      try {
        await apiClient.markNotificationsRead({ notification_ids: ids });
        setNotifications((prev) =>
          prev.map((item) => {
            if (!ids || ids.includes(item.id)) {
              return {
                ...item,
                read_at: item.read_at || new Date().toISOString()
              };
            }
            return item;
          })
        );
      } catch (err) {
        console.error("No se pudieron marcar como leídas", err);
      }
    },
    [user]
  );

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read_at).length, [notifications]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      permission,
      refresh,
      markAsRead,
      requestPermission
    }),
    [notifications, unreadCount, loading, permission, refresh, markAsRead, requestPermission]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications debe usarse dentro de NotificationsProvider");
  }
  return ctx;
}
