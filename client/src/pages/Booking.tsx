import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Calendar, Clock, Link2, Plus, Settings, Trash2, Edit2,
  CheckCircle2, XCircle, AlertCircle, User, Copy, ExternalLink, Mail, Loader2,
} from "lucide-react";
import { SkeletonRows } from "@/components/StateUI";
import { format } from "date-fns";
import AppLayout from "@/components/AppLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
type MeetingType = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  color: string;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  isActive: boolean;
  maxBookingsPerDay: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type Booking = {
  id: number;
  bookedByName: string;
  bookedByEmail: string;
  startTime: Date;
  endTime: Date;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  meetingType: { name: string; color: string; durationMinutes: number } | null;
};

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  completed: { label: "Completed", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: CheckCircle2 },
  no_show: { label: "No Show", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertCircle },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];
const COLOR_OPTIONS = ["#f5c842", "#60a5fa", "#34d399", "#f87171", "#a78bfa", "#fb923c", "#e879f9"];

// ─── Create/Edit Meeting Type Dialog ─────────────────────────────────────────
function MeetingTypeDialog({
  open, onClose, existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: MeetingType | null;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    description: existing?.description ?? "",
    durationMinutes: existing?.durationMinutes ?? 30,
    color: existing?.color ?? "#f5c842",
    bufferBeforeMinutes: existing?.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: existing?.bufferAfterMinutes ?? 0,
    maxBookingsPerDay: existing?.maxBookingsPerDay?.toString() ?? "",
  });

  const create = trpc.booking.createMeetingType.useMutation({
    onSuccess: () => {
      utils.booking.listMeetingTypes.invalidate();
      toast.success("Meeting type created");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.booking.updateMeetingType.useMutation({
    onSuccess: () => {
      utils.booking.listMeetingTypes.invalidate();
      toast.success("Meeting type updated");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit() {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      durationMinutes: form.durationMinutes,
      color: form.color,
      bufferBeforeMinutes: form.bufferBeforeMinutes,
      bufferAfterMinutes: form.bufferAfterMinutes,
      maxBookingsPerDay: form.maxBookingsPerDay ? parseInt(form.maxBookingsPerDay) : undefined,
    };
    if (existing) {
      update.mutate({ id: existing.id, ...payload });
    } else {
      create.mutate(payload);
    }
  }

  const loading = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-ivory">
            {existing ? "Edit Meeting Type" : "New Meeting Type"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-ivory/70 text-xs uppercase tracking-wider">Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Discovery Call"
              className="bg-white/5 border-white/10 text-ivory mt-1"
            />
          </div>
          <div>
            <Label className="text-ivory/70 text-xs uppercase tracking-wider">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this meeting for?"
              className="bg-white/5 border-white/10 text-ivory mt-1 resize-none"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-ivory/70 text-xs uppercase tracking-wider">Duration</Label>
              <Select
                value={form.durationMinutes.toString()}
                onValueChange={(v) => setForm({ ...form, durationMinutes: parseInt(v) })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-ivory mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d.toString()} className="text-ivory">
                      {d < 60 ? `${d} min` : `${d / 60}h`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-ivory/70 text-xs uppercase tracking-wider">Max / Day</Label>
              <Input
                value={form.maxBookingsPerDay}
                onChange={(e) => setForm({ ...form, maxBookingsPerDay: e.target.value })}
                placeholder="Unlimited"
                type="number"
                min={1}
                className="bg-white/5 border-white/10 text-ivory mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-ivory/70 text-xs uppercase tracking-wider">Buffer Before (min)</Label>
              <Input
                value={form.bufferBeforeMinutes}
                onChange={(e) => setForm({ ...form, bufferBeforeMinutes: parseInt(e.target.value) || 0 })}
                type="number" min={0} max={60}
                className="bg-white/5 border-white/10 text-ivory mt-1"
              />
            </div>
            <div>
              <Label className="text-ivory/70 text-xs uppercase tracking-wider">Buffer After (min)</Label>
              <Input
                value={form.bufferAfterMinutes}
                onChange={(e) => setForm({ ...form, bufferAfterMinutes: parseInt(e.target.value) || 0 })}
                type="number" min={0} max={60}
                className="bg-white/5 border-white/10 text-ivory mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-ivory/70 text-xs uppercase tracking-wider">Color</Label>
            <div className="flex gap-2 mt-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: form.color === c ? "white" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-ivory/60">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.name.trim()}
            className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90"
          >
            {loading ? "Saving…" : existing ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Availability Editor ──────────────────────────────────────────────────────
function AvailabilityEditor() {
  const utils = trpc.useUtils();
  const { data: avail, isLoading } = trpc.booking.getAvailability.useQuery();
  const setAvail = trpc.booking.setAvailability.useMutation({
    onSuccess: () => {
      utils.booking.getAvailability.invalidate();
      toast.success("Availability saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const [schedule, setSchedule] = useState<Array<{
    dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean;
  }> | null>(null);

  // Initialize from server data
  const effectiveSchedule = schedule ?? (avail ? avail.map((a) => ({
    dayOfWeek: a.dayOfWeek,
    startTime: a.startTime,
    endTime: a.endTime,
    isAvailable: a.isAvailable,
  })) : []);

  function toggleDay(dow: number) {
    const existing = effectiveSchedule.find((s) => s.dayOfWeek === dow);
    if (existing) {
      setSchedule(effectiveSchedule.map((s) =>
        s.dayOfWeek === dow ? { ...s, isAvailable: !s.isAvailable } : s
      ));
    } else {
      setSchedule([...effectiveSchedule, { dayOfWeek: dow, startTime: "09:00", endTime: "17:00", isAvailable: true }]);
    }
  }

  function updateTime(dow: number, field: "startTime" | "endTime", value: string) {
    const existing = effectiveSchedule.find((s) => s.dayOfWeek === dow);
    if (existing) {
      setSchedule(effectiveSchedule.map((s) =>
        s.dayOfWeek === dow ? { ...s, [field]: value } : s
      ));
    }
  }

  if (isLoading) return <SkeletonRows rows={7} />;

  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
        const day = effectiveSchedule.find((s) => s.dayOfWeek === dow) ?? {
          dayOfWeek: dow, startTime: "09:00", endTime: "17:00", isAvailable: false,
        };
        return (
          <div key={dow} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <Switch
              checked={day.isAvailable}
              onCheckedChange={() => toggleDay(dow)}
            />
            <span className="w-10 text-ivory font-medium text-sm">{DAYS[dow]}</span>
            {day.isAvailable ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="time"
                  value={day.startTime}
                  onChange={(e) => updateTime(dow, "startTime", e.target.value)}
                  className="bg-white/5 border-white/10 text-ivory w-32"
                />
                <span className="text-ivory/40">—</span>
                <Input
                  type="time"
                  value={day.endTime}
                  onChange={(e) => updateTime(dow, "endTime", e.target.value)}
                  className="bg-white/5 border-white/10 text-ivory w-32"
                />
              </div>
            ) : (
              <span className="text-ivory/30 text-sm">Unavailable</span>
            )}
          </div>
        );
      })}
      <Button
        onClick={() => setAvail.mutate(effectiveSchedule.filter((s) => s.isAvailable))}
        disabled={setAvail.isPending}
        className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90 mt-2"
      >
        {setAvail.isPending ? "Saving…" : "Save Availability"}
      </Button>
    </div>
  );
}

// ─── Main Booking Page ────────────────────────────────────────────────────────
export default function BookingPage() {
  const [activeTab, setActiveTab] = useState("meeting-types");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMT, setEditingMT] = useState<MeetingType | null>(null);

  const utils = trpc.useUtils();
  const { data: meetingTypesList, isLoading: mtLoading } = trpc.booking.listMeetingTypes.useQuery();
  const { data: upcomingBookings, isLoading: bookingsLoading } = trpc.booking.listBookings.useQuery({ upcoming: true });
  const { data: allBookings, isLoading: allBookingsLoading } = trpc.booking.listBookings.useQuery({});

  const deleteMT = trpc.booking.deleteMeetingType.useMutation({
    onSuccess: () => { utils.booking.listMeetingTypes.invalidate(); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.booking.updateBookingStatus.useMutation({
    onSuccess: () => { utils.booking.listBookings.invalidate(); toast.success("Status updated"); },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = trpc.booking.updateMeetingType.useMutation({
    onSuccess: () => { utils.booking.listMeetingTypes.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function copyBookingLink(slug: string) {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Booking link copied!");
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ivory tracking-tight">Booking & Scheduling</h1>
          <p className="text-ivory/50 text-sm mt-1">Manage your meeting types, availability, and appointments</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Meeting Type
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Meeting Types", value: meetingTypesList?.length ?? 0, icon: Calendar, color: "#f5c842" },
          { label: "Upcoming", value: upcomingBookings?.filter((b) => b.status === "confirmed").length ?? 0, icon: Clock, color: "#60a5fa" },
          { label: "This Month", value: allBookings?.filter((b) => {
            const d = new Date(b.startTime);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length ?? 0, icon: CheckCircle2, color: "#34d399" },
          { label: "No Shows", value: allBookings?.filter((b) => b.status === "no_show").length ?? 0, icon: AlertCircle, color: "#f87171" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-ivory">{value}</div>
                <div className="text-xs text-ivory/50">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="meeting-types" className="data-[state=active]:bg-[#f5c842] data-[state=active]:text-black text-ivory/70">
            Meeting Types
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#f5c842] data-[state=active]:text-black text-ivory/70">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="all-bookings" className="data-[state=active]:bg-[#f5c842] data-[state=active]:text-black text-ivory/70">
            All Bookings
          </TabsTrigger>
          <TabsTrigger value="availability" className="data-[state=active]:bg-[#f5c842] data-[state=active]:text-black text-ivory/70">
            Availability
          </TabsTrigger>
        </TabsList>

        {/* Meeting Types Tab */}
        <TabsContent value="meeting-types" className="mt-4">
          {mtLoading ? (
            <SkeletonRows rows={3} />
          ) : !meetingTypesList?.length ? (
            <div className="text-center py-16 text-ivory/40">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No meeting types yet</p>
              <p className="text-sm mt-1">Create your first meeting type to start accepting bookings</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {meetingTypesList.map((mt) => (
                <Card key={mt.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mt.color }} />
                        <CardTitle className="text-ivory text-base">{mt.name}</CardTitle>
                      </div>
                      <Switch
                        checked={mt.isActive}
                        onCheckedChange={(v) => toggleActive.mutate({ id: mt.id, isActive: v })}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mt.description && (
                      <p className="text-ivory/50 text-sm line-clamp-2">{mt.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-ivory/50">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mt.durationMinutes < 60 ? `${mt.durationMinutes}m` : `${mt.durationMinutes / 60}h`}
                      </span>
                      {(mt.bufferBeforeMinutes > 0 || mt.bufferAfterMinutes > 0) && (
                        <span>+{mt.bufferBeforeMinutes}/{mt.bufferAfterMinutes}m buffer</span>
                      )}
                      {mt.maxBookingsPerDay && <span>Max {mt.maxBookingsPerDay}/day</span>}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-ivory/60 hover:text-ivory h-7 px-2"
                        onClick={() => copyBookingLink(mt.slug)}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-ivory/60 hover:text-ivory h-7 px-2"
                        onClick={() => window.open(`/book/${mt.slug}`, "_blank")}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> Preview
                      </Button>
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-ivory/60 hover:text-[#f5c842] h-7 w-7 p-0"
                        onClick={() => setEditingMT(mt as MeetingType)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-ivory/60 hover:text-red-400 h-7 w-7 p-0"
                        onClick={() => deleteMT.mutate({ id: mt.id })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Upcoming Bookings Tab */}
        <TabsContent value="upcoming" className="mt-4">
          {bookingsLoading ? (
            <SkeletonRows rows={5} />
          ) : !upcomingBookings?.length ? (
            <div className="text-center py-16 text-ivory/40">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No upcoming bookings</p>
              <p className="text-sm mt-1">Share your booking links to start receiving appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((b) => (
                <BookingRow key={b.id} booking={b as Booking} onStatusChange={(id, status) => updateStatus.mutate({ id, status })} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* All Bookings Tab */}
        <TabsContent value="all-bookings" className="mt-4">
          {allBookingsLoading ? (
            <SkeletonRows rows={8} />
          ) : !allBookings?.length ? (
            <div className="text-center py-16 text-ivory/40">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allBookings.map((b) => (
                <BookingRow key={b.id} booking={b as Booking} onStatusChange={(id, status) => updateStatus.mutate({ id, status })} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-ivory flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#f5c842]" />
                Weekly Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AvailabilityEditor />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MeetingTypeDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
      {editingMT && (
        <MeetingTypeDialog
          open={true}
          onClose={() => setEditingMT(null)}
          existing={editingMT}
        />
      )}
    </div>
  );
}

// ─── Booking Row Component ────────────────────────────────────────────────────
function BookingRow({
  booking, onStatusChange,
}: {
  booking: Booking;
  onStatusChange: (id: number, status: "confirmed" | "cancelled" | "completed" | "no_show") => void;
}) {
  const cfg = STATUS_CONFIG[booking.status];
  const StatusIcon = cfg.icon;
  const sendConfirmation = trpc.portal.sendBookingConfirmation.useMutation({
    onSuccess: () => toast.success("Confirmation email sent"),
    onError: (e) => toast.error(e.message),
  });

  return (
    <AppLayout>
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
      <div className="w-10 h-10 rounded-full bg-[#f5c842]/10 flex items-center justify-center flex-shrink-0">
        <User className="w-5 h-5 text-[#f5c842]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-ivory font-medium text-sm truncate">{booking.bookedByName}</span>
          {booking.meetingType && (
            <span className="text-xs text-ivory/40 truncate">· {booking.meetingType.name}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-ivory/50">
          <span>{booking.bookedByEmail}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(booking.startTime), "MMM d, yyyy 'at' h:mm a")}
          </span>
          {booking.meetingType && (
            <span>{booking.meetingType.durationMinutes}m</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={`${cfg.color} border text-xs flex items-center gap-1`}>
          <StatusIcon className="w-3 h-3" />
          {cfg.label}
        </Badge>
        {booking.status === "confirmed" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => sendConfirmation.mutate({ bookingId: booking.id })}
            disabled={sendConfirmation.isPending}
            className="h-7 px-2 text-xs text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10"
            title="Send confirmation email"
          >
            {sendConfirmation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
          </Button>
        )}
        {booking.status === "confirmed" && (
          <Select onValueChange={(v) => onStatusChange(booking.id, v as any)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-ivory/60 h-7 w-28 text-xs">
              <SelectValue placeholder="Update" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10">
              <SelectItem value="completed" className="text-ivory text-xs">Completed</SelectItem>
              <SelectItem value="cancelled" className="text-ivory text-xs">Cancelled</SelectItem>
              <SelectItem value="no_show" className="text-ivory text-xs">No Show</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
