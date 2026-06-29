import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText, Plus, DollarSign, Clock, AlertCircle, TrendingUp,
  Search, MoreHorizontal, Send, CheckCircle, Link, Trash2,
  Download, RefreshCw, X,
} from "lucide-react";
import { SkeletonRows } from "@/components/StateUI";
import AppLayout from "@/components/AppLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  sent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  viewed: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  overdue: "bg-red-500/20 text-red-300 border-red-500/30",
  cancelled: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
};

// ─── Invoice Builder Dialog ───────────────────────────────────────────────────
function InvoiceBuilderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    paymentTerms: "net_30" as const,
    taxRate: 0,
    discountAmount: 0,
    notes: "",
    isRecurring: false,
    recurringInterval: "monthly" as const,
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ]);

  const { data: nextNumber } = trpc.invoicing.getNextInvoiceNumber.useQuery();

  const subtotal = useMemo(() => lineItems.reduce((s, i) => s + i.amount, 0), [lineItems]);
  const taxAmount = useMemo(() => (subtotal * form.taxRate) / 100, [subtotal, form.taxRate]);
  const total = useMemo(() => subtotal + taxAmount - form.discountAmount, [subtotal, taxAmount, form.discountAmount]);

  const updateLineItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === "quantity" || field === "rate") {
        updated[idx].amount = updated[idx].quantity * updated[idx].rate;
      }
      return updated;
    });
  };

  const create = trpc.invoicing.createInvoice.useMutation({
    onSuccess: (data) => {
      utils.invoicing.listInvoices.invalidate();
      utils.invoicing.getRevenueStats.invalidate();
      utils.invoicing.getNextInvoiceNumber.invalidate();
      toast.success(`Invoice ${data.invoiceNumber} created`);
      onClose();
      setForm({ clientName: "", clientEmail: "", paymentTerms: "net_30", taxRate: 0, discountAmount: 0, notes: "", isRecurring: false, recurringInterval: "monthly" });
      setLineItems([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
    },
    onError: (e) => toast.error(e.message),
  });

  const validItems = lineItems.filter((i) => i.description.trim());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-[#e5e5e5] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#f5c842] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            New Invoice
            {nextNumber && <span className="text-sm font-mono text-[#666] ml-2">{nextNumber}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <Label className="text-xs text-[#888]">Client Name *</Label>
              <Input className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Label className="text-xs text-[#888]">Client Email</Label>
              <Input type="email" className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={form.clientEmail}
                onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))} />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-[#888]">Line Items</Label>
              <Button variant="ghost" size="sm" className="text-[#f5c842] text-xs h-7"
                onClick={() => setLineItems((p) => [...p, { description: "", quantity: 1, rate: 0, amount: 0 }])}>
                <Plus className="w-3 h-3 mr-1" /> Add Line
              </Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs text-[#555] px-1">
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-2 text-right">Amount</span>
              </div>
              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Input className="col-span-6 bg-[#111] border-[#333] text-[#e5e5e5] h-8 text-sm"
                    placeholder="Service description"
                    value={item.description}
                    onChange={(e) => updateLineItem(idx, "description", e.target.value)} />
                  <Input className="col-span-2 bg-[#111] border-[#333] text-[#e5e5e5] h-8 text-sm text-right"
                    type="number" min="0" value={item.quantity}
                    onChange={(e) => updateLineItem(idx, "quantity", Number(e.target.value))} />
                  <Input className="col-span-2 bg-[#111] border-[#333] text-[#e5e5e5] h-8 text-sm text-right"
                    type="number" min="0" step="0.01" value={item.rate}
                    onChange={(e) => updateLineItem(idx, "rate", Number(e.target.value))} />
                  <div className="col-span-1 text-right text-sm text-[#e5e5e5] font-mono">
                    ${item.amount.toFixed(2)}
                  </div>
                  <Button variant="ghost" size="sm" className="col-span-1 h-8 w-8 p-0 text-[#555] hover:text-red-400"
                    onClick={() => setLineItems((p) => p.filter((_, i) => i !== idx))}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals + Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-[#888]">Payment Terms</Label>
                <Select value={form.paymentTerms} onValueChange={(v) => setForm((f) => ({ ...f, paymentTerms: v as any }))}>
                  <SelectTrigger className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    <SelectItem value="due_on_receipt" className="text-[#e5e5e5]">Due on Receipt</SelectItem>
                    <SelectItem value="net_15" className="text-[#e5e5e5]">Net 15</SelectItem>
                    <SelectItem value="net_30" className="text-[#e5e5e5]">Net 30</SelectItem>
                    <SelectItem value="net_60" className="text-[#e5e5e5]">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-[#888]">Tax %</Label>
                  <Input type="number" min="0" max="100" step="0.1" className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1 h-8 text-sm"
                    value={form.taxRate}
                    onChange={(e) => setForm((f) => ({ ...f, taxRate: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs text-[#888]">Discount $</Label>
                  <Input type="number" min="0" step="0.01" className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1 h-8 text-sm"
                    value={form.discountAmount}
                    onChange={(e) => setForm((f) => ({ ...f, discountAmount: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#888]">Notes</Label>
                <Textarea className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1 resize-none text-sm" rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#111] rounded-xl p-4 space-y-2 text-sm self-start">
              <div className="flex justify-between text-[#666]">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              {form.taxRate > 0 && (
                <div className="flex justify-between text-[#666]">
                  <span>Tax ({form.taxRate}%)</span>
                  <span className="font-mono">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              {form.discountAmount > 0 && (
                <div className="flex justify-between text-[#666]">
                  <span>Discount</span>
                  <span className="font-mono text-red-400">-${form.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#f5c842] border-t border-[#2a2a2a] pt-2 mt-2">
                <span>Total</span>
                <span className="font-mono">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recurring"
              checked={form.isRecurring}
              onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
              className="accent-[#f5c842]"
            />
            <Label htmlFor="recurring" className="text-sm text-[#888] cursor-pointer">Recurring invoice</Label>
            {form.isRecurring && (
              <Select value={form.recurringInterval} onValueChange={(v) => setForm((f) => ({ ...f, recurringInterval: v as any }))}>
                <SelectTrigger className="w-32 bg-[#111] border-[#333] text-[#e5e5e5] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333]">
                  {["weekly", "monthly", "quarterly", "yearly"].map((v) => (
                    <SelectItem key={v} value={v} className="text-[#e5e5e5] capitalize">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[#888]">Cancel</Button>
          <Button
            className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90"
            disabled={!form.clientName || validItems.length === 0 || create.isPending}
            onClick={() => create.mutate({ ...form, lineItems: validItems })}
          >
            {create.isPending ? "Creating…" : "Create Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Revenue Stats Bar ────────────────────────────────────────────────────────
function RevenueStats() {
  const { data: stats, isLoading } = trpc.invoicing.getRevenueStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-[#222] rounded w-16 mb-2" />
            <div className="h-7 bg-[#222] rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <DollarSign className="w-4 h-4" />, color: "text-emerald-400" },
    { label: "Outstanding", value: `$${stats.outstanding.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <Clock className="w-4 h-4" />, color: "text-blue-400" },
    { label: "Overdue", value: `$${stats.overdue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <AlertCircle className="w-4 h-4" />, color: "text-red-400" },
    { label: "MRR", value: `$${stats.mrr.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <TrendingUp className="w-4 h-4" />, color: "text-[#f5c842]" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
          <div className={`flex items-center gap-2 text-xs text-[#666] mb-1 ${card.color}`}>
            {card.icon}
            {card.label}
          </div>
          <p className={`text-xl font-bold font-mono ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Invoice Row Actions ──────────────────────────────────────────────────────
function InvoiceActions({ invoice }: { invoice: any }) {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();

  const send = trpc.invoicing.sendInvoice.useMutation({
    onSuccess: () => { utils.invoicing.listInvoices.invalidate(); toast.success("Invoice sent"); },
    onError: (e) => toast.error(e.message),
  });

  const markPaid = trpc.invoicing.markPaid.useMutation({
    onSuccess: () => { utils.invoicing.listInvoices.invalidate(); utils.invoicing.getRevenueStats.invalidate(); toast.success("Marked as paid"); },
  });

  const createLink = trpc.invoicing.createStripePaymentLink.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("Payment link created");
      utils.invoicing.listInvoices.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.invoicing.deleteInvoice.useMutation({
    onSuccess: () => { utils.invoicing.listInvoices.invalidate(); utils.invoicing.getRevenueStats.invalidate(); toast.success("Invoice deleted"); },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#555] hover:text-[#e5e5e5]">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#333]">
        {invoice.status === "draft" && (
          <DropdownMenuItem className="text-[#e5e5e5] cursor-pointer" onClick={() => send.mutate({ id: invoice.id })}>
            <Send className="w-3 h-3 mr-2" /> Send to Client
          </DropdownMenuItem>
        )}
        {["sent", "viewed", "overdue"].includes(invoice.status) && (
          <>
            <DropdownMenuItem className="text-[#e5e5e5] cursor-pointer" onClick={() => markPaid.mutate({ id: invoice.id })}>
              <CheckCircle className="w-3 h-3 mr-2" /> Mark as Paid
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[#e5e5e5] cursor-pointer" onClick={() => createLink.mutate({ id: invoice.id })}>
              <Link className="w-3 h-3 mr-2" /> Create Payment Link
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem className="text-red-400 cursor-pointer" onClick={() => del.mutate({ id: invoice.id })}>
          <Trash2 className="w-3 h-3 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main Invoicing Page ──────────────────────────────────────────────────────
export default function Invoicing() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);

  const { data: invoices = [], isLoading } = trpc.invoicing.listInvoices.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    limit: 100,
  });

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  const formatDate = (date: Date | null | undefined) =>
    date ? new Date(date).toLocaleDateString() : "—";

  return (
    <AppLayout>
    <div className="p-4 md:p-6 space-y-6 animate-[oh-fade-up_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e5e5]">Invoicing</h1>
          <p className="text-sm text-[#666] mt-0.5">Create, send, and track client invoices</p>
        </div>
        <Button
          className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90"
          onClick={() => setBuilderOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Invoice
        </Button>
      </div>

      {/* Revenue Stats */}
      <RevenueStats />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <Input
            placeholder="Search by client name…"
            className="pl-9 bg-[#111] border-[#2a2a2a] text-[#e5e5e5] placeholder:text-[#555]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-[#111] border-[#2a2a2a] text-[#e5e5e5]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#333]">
            <SelectItem value="" className="text-[#e5e5e5]">All statuses</SelectItem>
            {["draft", "sent", "viewed", "paid", "overdue", "cancelled"].map((s) => (
              <SelectItem key={s} value={s} className="text-[#e5e5e5] capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      {isLoading ? (
        <SkeletonRows rows={5} />
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-[#555]">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No invoices yet. Create your first invoice to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#2a2a2a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#111]">
                <th className="text-left px-4 py-3 text-[#666] font-medium">Invoice #</th>
                <th className="text-left px-4 py-3 text-[#666] font-medium">Client</th>
                <th className="text-left px-4 py-3 text-[#666] font-medium hidden md:table-cell">Due Date</th>
                <th className="text-right px-4 py-3 text-[#666] font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-[#666] font-medium">Status</th>
                <th className="text-right px-4 py-3 text-[#666] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const isOverdue = ["sent", "viewed"].includes(invoice.status) && invoice.dueDate && new Date(invoice.dueDate) < new Date();
                const effectiveStatus = isOverdue ? "overdue" : invoice.status;
                return (
                  <tr key={invoice.id} className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#f5c842] text-xs">{invoice.invoiceNumber}</span>
                        {invoice.isRecurring && (
                          <RefreshCw className="w-3 h-3 text-[#555]" aria-label="Recurring" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#e5e5e5]">{invoice.clientName}</p>
                      {invoice.clientEmail && <p className="text-xs text-[#666]">{invoice.clientEmail}</p>}
                    </td>
                    <td className="px-4 py-3 text-[#888] text-xs hidden md:table-cell">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#e5e5e5]">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[effectiveStatus] ?? ""}`}>
                        {effectiveStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <InvoiceActions invoice={{ ...invoice, status: effectiveStatus }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InvoiceBuilderDialog open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </div>
    </AppLayout>
  );
}
