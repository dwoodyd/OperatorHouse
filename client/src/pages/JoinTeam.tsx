import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function JoinTeam() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [accepted, setAccepted] = useState(false);

  const { data: invite, isLoading, error } = trpc.team.getInvite.useQuery(
    { token: token ?? "" },
    { enabled: !!token }
  );

  const acceptMutation = trpc.team.acceptInvite.useMutation({
    onSuccess: () => {
      setAccepted(true);
      toast.success("Welcome to the team!");
      setTimeout(() => setLocation("/dashboard"), 2000);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ivory mb-2">Invalid Invite</h2>
          <p className="text-ivory/50 text-sm">This invite link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (invite.status !== "pending") {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <XCircle className="w-14 h-14 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ivory mb-2">Invite Unavailable</h2>
          <p className="text-ivory/50 text-sm capitalize">This invite has been {invite.status}.</p>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ivory mb-2">Welcome aboard!</h2>
          <p className="text-ivory/50 text-sm">Redirecting you to the dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#f5c842]/10 flex items-center justify-center mx-auto">
          <Users className="w-7 h-7 text-[#f5c842]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ivory">You're Invited</h1>
          <p className="text-ivory/50 text-sm mt-2">
            You've been invited to join a workspace on Operator House as a{" "}
            <span className="text-ivory font-medium capitalize">{invite.role}</span>.
          </p>
          <p className="text-ivory/30 text-xs mt-1">{invite.email}</p>
        </div>

        {!isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-ivory/50">Sign in to accept this invitation.</p>
            <Button
              onClick={() => {
                sessionStorage.setItem('oh_post_login_redirect', `/join-team/${token}`);
                window.location.href = getLoginUrl();
              }}
              className="w-full bg-[#f5c842] text-[#0e0c09] hover:bg-[#f5c842]/90 font-semibold"
            >
              Sign In to Accept
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-ivory/50">
              Accepting as <span className="text-ivory">{user?.name || user?.email}</span>
            </p>
            <Button
              onClick={() => acceptMutation.mutate({ token: token ?? "" })}
              disabled={acceptMutation.isPending}
              className="w-full bg-[#f5c842] text-[#0e0c09] hover:bg-[#f5c842]/90 font-semibold"
            >
              {acceptMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Accepting…</>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
