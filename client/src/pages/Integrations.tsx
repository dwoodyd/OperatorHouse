import { useState, useEffect } from "react";
import { GuidedTour, TourTriggerButton, type TourStep } from "@/components/GuidedTour";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plug, Key, Download, RefreshCw, CheckCircle, XCircle, Clock,
  Copy, Eye, EyeOff, Trash2, Plus, Zap, Calendar, BookOpen, CreditCard, Slack
} from "lucide-react";

// ── Icon map ──────────────────────────────────────────────────────────────────
const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  slack: <Slack className="w-6 h-6 text-[#4A154B]" />,
  google: <Calendar className="w-6 h-6 text-blue-500" />,
  quickbooks: <BookOpen className="w-6 h-6 text-green-600" />,
  zapier: <Zap className="w-6 h-6 text-orange-500" />,
  stripe: <CreditCard className="w-6 h-6 text-purple-600" />,
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface IntegrationField {
  key: string;
  label: string;
  type: string;
  placeholder: string;
}

interface Integration {
  provider: string;
  label: string;
  description: string;
  icon: string;
  fields: IntegrationField[];
  isEnabled: boolean;
  lastTestedAt: Date | null;
  lastTestStatus: string | null;
  configId: number | null;
}

// ── Integration Card ──────────────────────────────────────────────────────────
function IntegrationCard({ integration, onConfigure }: { integration: Integration; onConfigure: (i: Integration) => void }) {
  const utils = trpc.useUtils();
  const toggle = trpc.integrations.toggleIntegration.useMutation({
    onSuccess: () => utils.integrations.listIntegrations.invalidate(),
  });
  const test = trpc.integrations.testIntegration.useMutation({
    onSuccess: (data: { status: string; message: string }) => {
      if (data.status === "success") toast.success(`${integration.label}: ${data.message}`);
      else toast.error(`${integration.label}: ${data.message}`);
      utils.integrations.listIntegrations.invalidate();
    },
  });

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              {PROVIDER_ICONS[integration.icon] ?? <Plug className="w-5 h-5" />}
            </div>
            <div>
              <CardTitle className="text-base">{integration.label}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {integration.isEnabled ? (
                  <Badge variant="default" className="text-xs bg-green-600">Connected</Badge>
                ) : integration.configId ? (
                  <Badge variant="secondary" className="text-xs">Configured</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Not configured</Badge>
                )}
                {integration.lastTestStatus && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {integration.lastTestStatus === "success"
                      ? <CheckCircle className="w-3 h-3 text-green-500" />
                      : <XCircle className="w-3 h-3 text-red-500" />}
                    Last tested {integration.lastTestedAt ? new Date(integration.lastTestedAt).toLocaleDateString() : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          {integration.configId && (
            <Switch
              checked={integration.isEnabled}
              onCheckedChange={(v) => toggle.mutate({ provider: integration.provider, isEnabled: v })}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onConfigure(integration)}>
            {integration.configId ? "Edit Config" : "Configure"}
          </Button>
          {integration.configId && (
            <Button
              size="sm"
              variant="ghost"
              disabled={test.isPending}
              onClick={() => test.mutate({ provider: integration.provider })}
            >
              {test.isPending ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : null}
              Test
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Configure Dialog ──────────────────────────────────────────────────────────
function ConfigureDialog({ integration, open, onClose }: { integration: Integration | null; open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const save = trpc.integrations.saveIntegrationConfig.useMutation({
    onSuccess: () => {
      toast.success("Integration configured");
      utils.integrations.listIntegrations.invalidate();
      onClose();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  if (!integration) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {integration.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {integration.fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  rows={4}
                  className="font-mono text-xs"
                />
              ) : (
                <div className="relative">
                  <Input
                    type={field.type === "password" && !showSecrets[field.key] ? "password" : "text"}
                    placeholder={field.placeholder}
                    value={values[field.key] ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  />
                  {field.type === "password" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => setShowSecrets(s => ({ ...s, [field.key]: !s[field.key] }))}
                    >
                      {showSecrets[field.key] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={save.isPending}
            onClick={() => save.mutate({ provider: integration.provider, config: values, isEnabled: true })}
          >
            {save.isPending ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : null}
            Save & Enable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── API Keys Panel ────────────────────────────────────────────────────────────
function ApiKeysPanel() {
  const utils = trpc.useUtils();
  const { data: keys = [], isLoading } = trpc.integrations.listApiKeys.useQuery();
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const create = trpc.integrations.createApiKey.useMutation({
    onSuccess: (data) => {
      setCreatedKey(data.key);
      setNewKeyName("");
      utils.integrations.listApiKeys.invalidate();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const revoke = trpc.integrations.revokeApiKey.useMutation({
    onSuccess: () => {
      toast.success("API key revoked");
      utils.integrations.listApiKeys.invalidate();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">API Keys</h3>
          <p className="text-sm text-muted-foreground">Use these keys to access the Operator House API programmatically.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Key
        </Button>
      </div>

      {showCreate && (
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Key name (e.g. Zapier Integration)"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
              />
              <Button
                disabled={!newKeyName || create.isPending}
                onClick={() => create.mutate({ name: newKeyName })}
              >
                {create.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Create"}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {createdKey && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
              ✅ API key created — copy it now, it won't be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono break-all">{createdKey}</code>
              <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(createdKey); toast.success("Copied!"); }}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setCreatedKey(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Key className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No API keys yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(keys as any[]).map((k) => (
            <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{k.name}</span>
                  {k.isActive ? (
                    <Badge variant="default" className="text-xs bg-green-600">Active</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">Revoked</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <code className="text-xs text-muted-foreground font-mono">{k.keyPrefix}••••••••</code>
                  {k.lastUsedAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Used {new Date(k.lastUsedAt).toLocaleDateString()}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(k.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {k.isActive ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => revoke.mutate({ id: k.id })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── QuickBooks Export Panel ───────────────────────────────────────────────────
function ExportPanel() {
  const [statusFilter, setStatusFilter] = useState<"paid" | "all">("paid");
  const { data, isLoading, refetch } = trpc.integrations.exportInvoicesCsv.useQuery({ status: statusFilter }) as { data: { csv: string; count: number } | undefined; isLoading: boolean; refetch: () => void };

  const downloadCsv = () => {
    if (!data?.csv) return;
    const blob = new Blob([data.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${statusFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${data.count} invoices`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">QuickBooks / CSV Export</h3>
        <p className="text-sm text-muted-foreground">Export your invoices in QuickBooks-compatible CSV format for accounting.</p>
      </div>
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label>Invoice Status</Label>
              <div className="flex gap-2">
                {(["paid", "all"] as const).map(s => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusFilter === s ? "default" : "outline"}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === "paid" ? "Paid only" : "All invoices"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.count} invoice{data.count !== 1 ? "s" : ""} ready to export
            </p>
          )}
          <Button onClick={downloadCsv} disabled={isLoading || !data?.count}>
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Activity Log ──────────────────────────────────────────────────────────────
function ActivityLog() {
  const { data: logs = [], isLoading } = trpc.integrations.listLogs.useQuery({ limit: 30 });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Integration Activity</h3>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
      ) : (
        <div className="space-y-1">
          {(logs as any[]).map((log) => (
            <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 text-sm">
              {log.status === "success"
                ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
              <span className="font-medium capitalize">{log.provider.replace("_", " ")}</span>
              <span className="text-muted-foreground">{log.event.replace(/_/g, " ")}</span>
              {log.error && <span className="text-red-500 text-xs truncate max-w-xs">{log.error}</span>}
              <span className="ml-auto text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TOUR_KEY = "oh_integrations_tour_v1";

const TOUR_STEPS: TourStep[] = [
  {
    target: "#tour-integrations-header",
    title: "Integrations Hub",
    description: "This is your command center for connecting Operator House to every tool in your stack — Slack, Google Calendar, QuickBooks, Zapier, Stripe, and more.",
    placement: "bottom",
  },
  {
    target: "#tour-tab-apps",
    title: "Connected Apps",
    description: "Browse and configure your connected apps here. Each card shows the live/test status and lets you enter API credentials or webhook URLs.",
    placement: "bottom",
  },
  {
    target: "#tour-tab-api",
    title: "API Keys",
    description: "Generate API keys scoped to read, write, or admin permissions. Share these with your developers or third-party tools to access Operator House data programmatically.",
    placement: "bottom",
  },
  {
    target: "#tour-tab-export",
    title: "QuickBooks Export",
    description: "Export your invoices as a QuickBooks-compatible CSV. Filter by date range and status, then download in one click for your accountant.",
    placement: "bottom",
  },
  {
    target: "#tour-tab-logs",
    title: "Activity Log",
    description: "Every integration event — webhook deliveries, API calls, sync attempts — is logged here with success/failure status so you can debug issues instantly.",
    placement: "bottom",
  },
  {
    target: "#tour-tour-btn",
    title: "Replay Anytime",
    description: 'You can replay this tour at any time by clicking the "Take a Tour" button in the page header. It will always be right here when you need a refresher.',
    placement: "left",
  },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Integrations() {
  const { data: integrations = [], isLoading } = trpc.integrations.listIntegrations.useQuery();
  const [configuring, setConfiguring] = useState<Integration | null>(null);
  const [tourOpen, setTourOpen] = useState(false);

  // Auto-start tour on first visit
  useEffect(() => {
    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) {
      const t = setTimeout(() => setTourOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);


  return (
    <AppLayout>
      <GuidedTour
        steps={TOUR_STEPS}
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        storageKey={TOUR_KEY}
      />
      <div className="p-6 space-y-6">
        <div id="tour-integrations-header" className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Integrations Hub</h1>
            <p className="text-muted-foreground mt-1">Connect Operator House to your existing tools and workflows.</p>
          </div>
          <div id="tour-tour-btn">
            <TourTriggerButton onClick={() => setTourOpen(true)} />
          </div>
        </div>

        <Tabs defaultValue="apps">
          <TabsList>
            <TabsTrigger id="tour-tab-apps" value="apps">Connected Apps</TabsTrigger>
            <TabsTrigger id="tour-tab-api" value="api">API Keys</TabsTrigger>
            <TabsTrigger id="tour-tab-export" value="export">Export</TabsTrigger>
            <TabsTrigger id="tour-tab-logs" value="logs">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="apps" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(integrations as Integration[]).map(i => (
                  <IntegrationCard key={i.provider} integration={i} onConfigure={setConfiguring} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="api" className="mt-6">
            <ApiKeysPanel />
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <ExportPanel />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <ActivityLog />
          </TabsContent>
        </Tabs>
      </div>

      <ConfigureDialog
        integration={configuring}
        open={!!configuring}
        onClose={() => setConfiguring(null)}
      />
    </AppLayout>
  );
}
