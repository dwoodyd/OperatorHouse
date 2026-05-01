import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, ArrowLeft, User, Mail, Phone } from "lucide-react";
import { format, parseISO } from "date-fns";

type Slot = { date: string; startTime: string; endTime: string };

// Group slots by date
function groupSlotsByDate(slots: Slot[]): Map<string, Slot[]> {
  const map = new Map<string, Slot[]>();
  for (const slot of slots) {
    const existing = map.get(slot.date) ?? [];
    map.set(slot.date, [...existing, slot]);
  }
  return map;
}

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [step, setStep] = useState<"pick-date" | "pick-time" | "fill-form" | "confirmed">("pick-date");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [booked, setBooked] = useState<{ startTime: Date; endTime: Date; meetingName: string } | null>(null);

  const { data, isLoading, error } = trpc.booking.getPublicSlots.useQuery(
    { slug: slug ?? "", daysAhead: 14 },
    { enabled: !!slug }
  );

  const createBooking = trpc.booking.createBooking.useMutation({
    onSuccess: (result) => {
      setBooked(result);
      setStep("confirmed");
    },
    onError: (e) => toast.error(e.message),
  });

  const slotsByDate = useMemo(() => groupSlotsByDate(data?.slots ?? []), [data?.slots]);
  const availableDates = Array.from(slotsByDate.keys()).sort();

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep("pick-time");
  }

  function handleSlotSelect(slot: Slot) {
    setSelectedSlot(slot);
    setStep("fill-form");
  }

  function handleSubmit() {
    if (!selectedSlot || !slug) return;
    createBooking.mutate({
      slug,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
    });
  }

  const mt = data?.meetingType;

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#f5c842] border-t-transparent rounded-full animate-spin" />
          <span className="text-ivory/50 text-sm">Loading booking page…</span>
        </div>
      </div>
    );
  }

  // Not found
  if (error || !mt) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-ivory/20 mx-auto mb-3" />
          <h2 className="text-ivory text-xl font-semibold">Booking page not found</h2>
          <p className="text-ivory/50 text-sm mt-2">This booking link may have been deactivated or doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Confirmed
  if (step === "confirmed" && booked) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ivory">You're booked!</h2>
            <p className="text-ivory/50 mt-2">A confirmation has been noted. See you soon.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f5c842]/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#f5c842]" />
              </div>
              <div>
                <div className="text-ivory font-medium text-sm">{booked.meetingName}</div>
                <div className="text-ivory/50 text-xs">{format(new Date(booked.startTime), "EEEE, MMMM d, yyyy")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f5c842]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#f5c842]" />
              </div>
              <div className="text-ivory/70 text-sm">
                {format(new Date(booked.startTime), "h:mm a")} – {format(new Date(booked.endTime), "h:mm a")}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ backgroundColor: `${mt.color}20` }}>
            <Calendar className="w-7 h-7" style={{ color: mt.color }} />
          </div>
          <h1 className="text-2xl font-bold text-ivory">{mt.name}</h1>
          {mt.description && <p className="text-ivory/50 mt-2 text-sm">{mt.description}</p>}
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge className="bg-white/5 border-white/10 text-ivory/60 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {mt.durationMinutes < 60 ? `${mt.durationMinutes} min` : `${mt.durationMinutes / 60}h`}
            </Badge>
          </div>
        </div>

        {/* Step: Pick Date */}
        {step === "pick-date" && (
          <div>
            <h2 className="text-ivory font-semibold mb-4 text-center">Select a date</h2>
            {availableDates.length === 0 ? (
              <div className="text-center py-12 text-ivory/40">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No available slots in the next 14 days</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableDates.map((date) => {
                  const d = parseISO(date);
                  return (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#f5c842]/50 hover:bg-[#f5c842]/5 transition-all text-center group"
                    >
                      <div className="text-xs text-ivory/50 group-hover:text-[#f5c842]/70">{format(d, "EEE")}</div>
                      <div className="text-xl font-bold text-ivory mt-0.5">{format(d, "d")}</div>
                      <div className="text-xs text-ivory/40 group-hover:text-ivory/60">{format(d, "MMM")}</div>
                      <div className="text-xs text-[#f5c842]/60 mt-1">{slotsByDate.get(date)?.length} slots</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step: Pick Time */}
        {step === "pick-time" && selectedDate && (
          <div>
            <button
              onClick={() => setStep("pick-date")}
              className="flex items-center gap-1 text-ivory/50 hover:text-ivory text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {format(parseISO(selectedDate), "EEEE, MMMM d")}
            </button>
            <h2 className="text-ivory font-semibold mb-4">Select a time</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {(slotsByDate.get(selectedDate) ?? []).map((slot) => (
                <button
                  key={slot.startTime}
                  onClick={() => handleSlotSelect(slot)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#f5c842]/50 hover:bg-[#f5c842]/5 transition-all text-center text-ivory text-sm font-medium"
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Fill Form */}
        {step === "fill-form" && selectedSlot && (
          <div>
            <button
              onClick={() => setStep("pick-time")}
              className="flex items-center gap-1 text-ivory/50 hover:text-ivory text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {format(parseISO(selectedSlot.date), "MMMM d")} at {selectedSlot.startTime}
            </button>
            <h2 className="text-ivory font-semibold mb-4">Your details</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div>
                <Label className="text-ivory/70 text-xs uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3" /> Full Name *
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  className="bg-white/5 border-white/10 text-ivory mt-1"
                />
              </div>
              <div>
                <Label className="text-ivory/70 text-xs uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email *
                </Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  type="email"
                  className="bg-white/5 border-white/10 text-ivory mt-1"
                />
              </div>
              <div>
                <Label className="text-ivory/70 text-xs uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone (optional)
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="bg-white/5 border-white/10 text-ivory mt-1"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createBooking.isPending || !form.name.trim() || !form.email.trim()}
                className="w-full bg-[#f5c842] text-black hover:bg-[#f5c842]/90 font-semibold mt-2"
              >
                {createBooking.isPending ? "Booking…" : "Confirm Booking"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
