import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkeletonRows } from "@/components/StateUI";
import {
  Users, UserPlus, Mail, Shield, Eye, Crown, Trash2,
  Clock, CheckCircle2, XCircle, MoreHorizontal, Copy, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: { label: "Admin", icon: Shield, color: "bg-purple-500/10 text-purple-400 border-purple-500/20", desc: "Full access — can manage all features and team members" },
  member: { label: "Member", icon: Users, color: "bg-blue-500/10 text-blue-400 border-blue-500/20", desc: "Standard access — can use all features but cannot manage team" },
  viewer: { label: "Viewer", icon: Eye, color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", desc: "Read-only — can view data but cannot create or edit" },
};

type Role = keyof typeof ROLE_CONFIG;

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.color} border text-xs flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
}

function Avatar({ name, email }: { name?: string | null; email: string }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : email[0].toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-[#f5c842]/10 border border-[#f5c842]/20 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-[#f5c842]">{initials}</span>
    </div>
  );
}

export default function Team() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");

  const { data, isLoading, refetch } = trpc.team.list.useQuery();

  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: () => {
      toast.success("Invite sent");
      setInviteOpen(false);
      setInviteEmail(""); setInviteRole("member");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRole = trpc.team.updateRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.team.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const removeMember = trpc.team.remove.useMutation({
    onSuccess: () => { toast.success("Member removed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const revokeInvite = trpc.team.revokeInvite.useMutation({
    onSuccess: () => { toast.success("Invite revoked"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const members = data?.members ?? [];
  const invites = data?.invites ?? [];

  return (
    <div className="min-h-screen bg-[#0e0c09] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ivory">Team & Permissions</h1>
          <p className="text-sm text-ivory/50 mt-0.5">Invite teammates and manage their access</p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="bg-[#f5c842] text-[#0e0c09] hover:bg-[#f5c842]/90 font-semibold"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="rounded-xl bg-white/5 border border-white/10 p-4 flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-ivory/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-ivory">{cfg.label}</p>
                <p className="text-xs text-ivory/40 mt-0.5">{cfg.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-sm text-ivory/50">
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          {members.length} active member{members.length !== 1 ? "s" : ""}
        </span>
        {invites.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-yellow-400" />
            {invites.length} pending invite{invites.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Members list */}
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : members.length === 0 && invites.length === 0 ? (
        <div className="text-center py-20 text-ivory/30">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No team members yet.</p>
          <p className="text-xs mt-1">Invite someone to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active members */}
          {members.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                m.status === "suspended"
                  ? "bg-white/2 border-white/5 opacity-60"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <Avatar name={m.name} email={m.email} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ivory truncate">{m.name || m.email}</span>
                  {m.status === "suspended" && (
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 border text-xs">Suspended</Badge>
                  )}
                </div>
                <p className="text-xs text-ivory/40 mt-0.5">{m.email}</p>
                <p className="text-xs text-ivory/30 mt-0.5">
                  Joined {format(new Date(m.joinedAt), "MMM d, yyyy")}
                </p>
              </div>
              <RoleBadge role={m.role as Role} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-ivory/40 hover:text-ivory h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a1a] border-white/10 text-ivory">
                  <DropdownMenuItem
                    onClick={() => updateRole.mutate({ memberId: m.id, role: "admin" })}
                    className="text-xs hover:bg-white/5"
                  >
                    <Shield className="w-3 h-3 mr-2 text-purple-400" /> Make Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateRole.mutate({ memberId: m.id, role: "member" })}
                    className="text-xs hover:bg-white/5"
                  >
                    <Users className="w-3 h-3 mr-2 text-blue-400" /> Make Member
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateRole.mutate({ memberId: m.id, role: "viewer" })}
                    className="text-xs hover:bg-white/5"
                  >
                    <Eye className="w-3 h-3 mr-2 text-zinc-400" /> Make Viewer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateStatus.mutate({ memberId: m.id, status: m.status === "active" ? "suspended" : "active" })}
                    className="text-xs hover:bg-white/5"
                  >
                    {m.status === "active" ? (
                      <><XCircle className="w-3 h-3 mr-2 text-yellow-400" /> Suspend</>
                    ) : (
                      <><CheckCircle2 className="w-3 h-3 mr-2 text-emerald-400" /> Reactivate</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => removeMember.mutate({ memberId: m.id })}
                    className="text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3 mr-2" /> Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {/* Pending invites */}
          {invites.length > 0 && (
            <>
              <p className="text-xs text-ivory/40 pt-2 pb-1 font-medium uppercase tracking-wider">Pending Invites</p>
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                  <div className="w-9 h-9 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ivory truncate">{inv.email}</p>
                    <p className="text-xs text-ivory/40 mt-0.5">
                      Expires {format(new Date(inv.expiresAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <RoleBadge role={inv.role as Role} />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revokeInvite.mutate({ inviteId: inv.id })}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-ivory">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-ivory/70 text-sm">Email Address</Label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="bg-white/5 border-white/10 text-ivory mt-1"
                type="email"
              />
            </div>
            <div>
              <Label className="text-ivory/70 text-sm">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-ivory mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key} className="text-ivory text-sm">
                      <div>
                        <p className="font-medium">{cfg.label}</p>
                        <p className="text-xs text-ivory/50">{cfg.desc}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ivory/60">
                An invite link will be sent to this email. The invite expires in 7 days.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} className="text-ivory/60">
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
              disabled={!inviteEmail || inviteMutation.isPending}
              className="bg-[#f5c842] text-[#0e0c09] hover:bg-[#f5c842]/90 font-semibold"
            >
              <Mail className="w-4 h-4 mr-2" />
              {inviteMutation.isPending ? "Sending…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
