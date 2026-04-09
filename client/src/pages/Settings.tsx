import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { User, Building2, Clock, Save, Loader2 } from "lucide-react";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
];

export default function Settings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const upsertProfile = trpc.profile.upsert.useMutation({
    onSuccess: () => toast.success("Settings saved"),
    onError: () => toast.error("Failed to save settings"),
  });

  const [companyName, setCompanyName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName ?? "");
      setTimezone(profile.timezone ?? "America/New_York");
    }
  }, [profile]);

  const handleSave = () => {
    upsertProfile.mutate({ companyName, timezone });
  };

  return (
    <AppLayout title="Settings" subtitle="Manage your GhostDesk profile and preferences">
      <div className="max-w-2xl mx-auto space-y-6 p-6">
        {/* Account Info */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} style={{ color: 'var(--amber)' }} />
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--amber)', fontFamily: 'Fira Code, monospace' }}>Account</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>Name</label>
              <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                {user?.name ?? "—"}
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>Email</label>
              <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                {user?.email ?? "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} style={{ color: 'var(--amber)' }} />
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--amber)', fontFamily: 'Fira Code, monospace' }}>Profile</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 py-4" style={{ color: 'var(--text-muted)' }}>
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm">Loading profile...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>Company / Brand Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Soul Engineer LLC"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--obsidian)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--amber)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Timezone */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: 'var(--amber)' }} />
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--amber)', fontFamily: 'Fira Code, monospace' }}>Timezone</h2>
          </div>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--obsidian)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={upsertProfile.isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: 'var(--amber)',
            color: '#0A0A0F',
            fontFamily: 'DM Sans, sans-serif',
            opacity: upsertProfile.isPending ? 0.7 : 1,
          }}
        >
          {upsertProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {upsertProfile.isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </AppLayout>
  );
}
