import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { User, Building2, Clock, Save, Trash2, ShieldAlert, Info, ExternalLink, AlertTriangle } from "lucide-react";

const APP_VERSION = "1.0.0";
const BUILD_DATE = "April 2026";

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "Pacific/Honolulu",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Dubai", "Australia/Sydney",
];

// ─── Delete Account Confirmation Modal ────────────────────────────────────────
function DeleteAccountModal({ onConfirm, onCancel, isPending }: {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  const canConfirm = confirmText === "DELETE";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md p-6 space-y-5"
        style={{
          background: "var(--surface)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: "8px",
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <AlertTriangle size={18} style={{ color: "#EF4444" }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>
              Delete Account
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Warning list */}
        <div
          className="p-4 space-y-2"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px" }}
        >
          {[
            "All leads and Operator Audits will be deleted",
            "All pipeline deals and deal history will be deleted",
            "All vault items, frameworks, and templates will be deleted",
            "All strategies and generated documents will be deleted",
            "All tasks and activity logs will be deleted",
            "Your account cannot be recovered after deletion",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "#EF4444" }} />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Confirmation input */}
        <div>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}>
            Type <span style={{ color: "#EF4444", fontFamily: "Fira Code, monospace", fontWeight: 600 }}>DELETE</span> to confirm
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="DELETE"
            className="w-full px-3 py-2 mt-1.5 text-sm outline-none"
            style={{
              background: "var(--obsidian)",
              color: "var(--text-primary)",
              border: `1px solid ${canConfirm ? "rgba(239,68,68,0.6)" : "var(--border-subtle)"}`,
              borderRadius: "6px",
              fontFamily: "Fira Code, monospace",
              letterSpacing: "0.08em",
              transition: "border-color 180ms ease",
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium"
            style={{
              background: "var(--surface-raised)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isPending}
            className="flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
            style={{
              background: canConfirm && !isPending ? "#EF4444" : "var(--surface-raised)",
              color: canConfirm && !isPending ? "#fff" : "var(--text-muted)",
              borderRadius: "6px",
              fontFamily: "DM Sans, sans-serif",
              transition: "background 180ms ease, color 180ms ease",
              cursor: canConfirm && !isPending ? "pointer" : "not-allowed",
            }}
          >
            {isPending ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────────────────
export default function Settings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const upsertProfile = trpc.profile.upsert.useMutation({
    onSuccess: () => toast.success("Settings saved"),
    onError: () => toast.error("Failed to save settings"),
  });
  const deleteAccount = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Account deleted. Goodbye.");
      setTimeout(() => setLocation("/"), 1500);
    },
    onError: (err) => toast.error(err.message || "Failed to delete account"),
  });

  const [companyName, setCompanyName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName ?? "");
      setTimezone(profile.timezone ?? "America/New_York");
    }
  }, [profile]);

  const handleSave = () => upsertProfile.mutate({ companyName, timezone });

  const SectionHeader = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={15} style={{ color: "var(--amber)" }} />
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--amber)", fontFamily: "Fira Code, monospace" }}>
        {label}
      </h2>
    </div>
  );

  return (
    <AppLayout title="Settings" subtitle="Profile, preferences, and account management">
      <div className="max-w-2xl mx-auto space-y-5 p-6">

        {/* Account Info */}
        <div className="glass-panel p-6">
          <SectionHeader icon={User} label="Account" />
          <div className="space-y-3">
            {[
              { label: "Name", value: user?.name ?? "—" },
              { label: "Email", value: user?.email ?? "—" },
              { label: "Role", value: user?.role ?? "user" },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}>{label}</label>
                <div className="px-3 py-2 text-sm" style={{ background: "var(--obsidian)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", borderRadius: "6px" }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Settings */}
        <div className="glass-panel p-6">
          <SectionHeader icon={Building2} label="Profile" />
          {isLoading ? (
            <div className="space-y-3 py-2">
              <div className="skeleton" style={{ height: 13, width: "40%", borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 36, borderRadius: 6 }} />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}>Company / Brand Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Operator LLC"
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--obsidian)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", borderRadius: "6px", fontFamily: "DM Sans, sans-serif", transition: "border-color 180ms ease" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--amber)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
                />
              </div>
            </div>
          )}
        </div>

        {/* Timezone */}
        <div className="glass-panel p-6">
          <SectionHeader icon={Clock} label="Timezone" />
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 text-sm outline-none"
            style={{ background: "var(--obsidian)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", borderRadius: "6px", fontFamily: "DM Sans, sans-serif" }}
          >
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={upsertProfile.isPending}
          className="flex items-center gap-2 px-6 py-3 text-sm font-semibold"
          style={{ background: "var(--amber)", color: "#0A0A0F", fontFamily: "DM Sans, sans-serif", borderRadius: "6px", opacity: upsertProfile.isPending ? 0.7 : 1 }}
        >
          <Save size={14} />
          {upsertProfile.isPending ? "Saving..." : "Save Settings"}
        </button>

        {/* About */}
        <div className="glass-panel p-6">
          <SectionHeader icon={Info} label="About" />
          <div className="space-y-3">
            {[
              { label: "App", value: "Operator House" },
              { label: "Version", value: `v${APP_VERSION}` },
              { label: "Build", value: BUILD_DATE },
              { label: "Powered by", value: "Manus AI" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}>{label}</span>
                <span style={{ fontSize: "13px", color: "var(--text-primary)", fontFamily: "Fira Code, monospace" }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-5 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <a
              href="/privacy"
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "var(--amber)", fontFamily: "DM Sans, sans-serif", textDecoration: "none" }}
            >
              <ExternalLink size={11} />
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "var(--amber)", fontFamily: "DM Sans, sans-serif", textDecoration: "none" }}
            >
              <ExternalLink size={11} />
              Terms of Service
            </a>
          </div>
        </div>

        {/* Danger Zone — Delete Account */}
        <div
          className="p-6"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px" }}
        >
          <SectionHeader icon={ShieldAlert} label="Danger Zone" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "DM Sans, sans-serif" }}>
                Delete Account
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", lineHeight: 1.5 }}>
                Permanently delete your account and all associated data. This action cannot be undone and is required to comply with data privacy regulations.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold flex-shrink-0"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#EF4444",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "6px",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              <Trash2 size={13} />
              Delete Account
            </button>
          </div>
        </div>

      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={() => deleteAccount.mutate()}
          onCancel={() => setShowDeleteModal(false)}
          isPending={deleteAccount.isPending}
        />
      )}
    </AppLayout>
  );
}
