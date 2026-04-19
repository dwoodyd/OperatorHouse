/* =============================================================================
   Operator House — NotificationBell
   Bell icon with unread badge, inbox dropdown, and toast pop-ups.
   Polls unread count every 30s; fires toast on new arrivals.
   ============================================================================= */
import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, CheckCheck, UserPlus, GitBranch, CreditCard, FileText, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type NotifType = "new_client" | "deal_moved" | "payment" | "briefing_ready" | "system";

const TYPE_ICON: Record<NotifType, React.ReactNode> = {
  new_client:     <UserPlus   size={13} />,
  deal_moved:     <GitBranch  size={13} />,
  payment:        <CreditCard size={13} />,
  briefing_ready: <FileText   size={13} />,
  system:         <Info       size={13} />,
};

const TYPE_COLOR: Record<NotifType, string> = {
  new_client:     "rgba(74,222,128,0.9)",   // green
  deal_moved:     "rgba(96,165,250,0.9)",   // blue
  payment:        "rgba(245,166,35,0.9)",   // amber
  briefing_ready: "rgba(192,132,252,0.9)",  // purple
  system:         "rgba(148,163,184,0.9)",  // slate
};

interface NotificationBellProps {
  /** Inline style overrides for the trigger button */
  buttonStyle?: React.CSSProperties;
  /** Size of the bell icon in px */
  iconSize?: number;
}

export default function NotificationBell({
  buttonStyle,
  iconSize = 14,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);

  // ── tRPC queries ──────────────────────────────────────────────────────────
  const utils = trpc.useUtils();

  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const { data: notifications = [] } = trpc.notifications.list.useQuery(
    { limit: 30 },
    { enabled: open }
  );

  const markReadMut    = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });
  const markAllReadMut = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  // ── Toast on new notifications (respects oh_notif_prefs) ───────────────────
  const prevCountRef = useRef<number>(unreadCount);
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      utils.notifications.list.fetch({ limit: 1 }).then((items) => {
        const newest = items[0];
        if (newest && !newest.isRead) {
          // Check user's notification preference for this type
          let muted = false;
          try {
            const prefs = JSON.parse(localStorage.getItem("oh_notif_prefs") ?? "{}");
            if (newest.type && prefs[newest.type] === false) muted = true;
          } catch {}
          if (!muted) {
            toast(newest.title, {
              description: newest.body ?? undefined,
              duration: 5000,
            });
          }
        }
      }).catch(() => {});
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, utils]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current   && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMarkOne = (id: number) => {
    markReadMut.mutate({ id });
  };
  const handleMarkAll = () => {
    markAllReadMut.mutate();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>
      {/* Bell trigger */}
      <button
        ref={btnRef}
        className="flex items-center justify-center"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "36px",
          height: "36px",
          background: open ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "6px",
          color: open ? "var(--amber, #F5A623)" : "var(--text-secondary, #9CA3AF)",
          transition: "background 180ms ease, border-color 180ms ease, color 180ms ease",
          position: "relative",
          ...buttonStyle,
        }}
      >
        <Bell size={iconSize} />
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread notifications`}
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "16px",
              height: "16px",
              padding: "0 3px",
              background: "#EF4444",
              borderRadius: "8px",
              fontSize: "9px",
              fontWeight: 700,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              fontFamily: "DM Sans, sans-serif",
              boxShadow: "0 0 0 2px rgba(14,14,22,1)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications panel"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "320px",
            maxHeight: "480px",
            display: "flex",
            flexDirection: "column",
            background: "rgba(14,14,22,0.98)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary, #E8E6E0)",
              }}
            >
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={markAllReadMut.isPending}
                title="Mark all as read"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                  fontFamily: "DM Sans, sans-serif",
                  color: "rgba(245,166,35,0.8)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 4px",
                  borderRadius: "4px",
                  transition: "color 150ms",
                }}
              >
                <CheckCheck size={11} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px 16px",
                  gap: "8px",
                  color: "rgba(148,163,184,0.6)",
                }}
              >
                <BellOff size={22} strokeWidth={1.5} />
                <span style={{ fontSize: "12px", fontFamily: "DM Sans, sans-serif" }}>
                  No notifications yet
                </span>
              </div>
            ) : (
              notifications.map((n) => {
                const type = (n.type ?? "system") as NotifType;
                const icon = TYPE_ICON[type] ?? TYPE_ICON.system;
                const iconColor = TYPE_COLOR[type] ?? TYPE_COLOR.system;
                const timeAgo = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true });
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && handleMarkOne(n.id)}
                    style={{
                      display: "flex",
                      gap: "10px",
                      padding: "10px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: n.isRead ? "transparent" : "rgba(245,166,35,0.03)",
                      cursor: n.isRead ? "default" : "pointer",
                      transition: "background 150ms",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: "26px",
                        height: "26px",
                        borderRadius: "6px",
                        background: `${iconColor}18`,
                        border: `1px solid ${iconColor}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: iconColor,
                        marginTop: "1px",
                      }}
                    >
                      {icon}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontFamily: "DM Sans, sans-serif",
                          fontWeight: n.isRead ? 400 : 600,
                          color: n.isRead ? "rgba(232,230,224,0.65)" : "rgba(232,230,224,0.95)",
                          lineHeight: 1.4,
                          marginBottom: n.body ? "2px" : 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.title}
                      </div>
                      {n.body && (
                        <div
                          style={{
                            fontSize: "11px",
                            fontFamily: "DM Sans, sans-serif",
                            color: "rgba(148,163,184,0.7)",
                            lineHeight: 1.4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {n.body}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: "10px",
                          fontFamily: "Fira Code, monospace",
                          color: "rgba(148,163,184,0.45)",
                          marginTop: "3px",
                        }}
                      >
                        {timeAgo}
                      </div>
                    </div>
                    {/* Unread dot */}
                    {!n.isRead && (
                      <div
                        style={{
                          flexShrink: 0,
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#F5A623",
                          marginTop: "8px",
                          boxShadow: "0 0 6px rgba(245,166,35,0.6)",
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
