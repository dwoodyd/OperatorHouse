import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Rocket, Search, Building2, Mail, Linkedin, Phone, User,
  Globe, MapPin, Briefcase, ChevronLeft, ChevronRight, Loader2,
  CheckCircle, Plus, Filter, Sparkles,
} from "lucide-react";

const COMPANY_SIZES = [
  { value: "1,50", label: "1-50" },
  { value: "51,200", label: "51-200" },
  { value: "201,500", label: "201-500" },
  { value: "501,1000", label: "501-1,000" },
  { value: "1001,5000", label: "1,001-5,000" },
  { value: "5001,10000", label: "5,001-10,000" },
  { value: "10001,", label: "10,000+" },
] as const;

const INDUSTRIES = [
  "Software", "Information Technology", "Financial Services", "Healthcare",
  "Marketing & Advertising", "Real Estate", "Education", "Manufacturing",
  "Retail", "Hospitality", "Construction", "Legal", "Consulting",
] as const;

interface ApolloLead {
  apolloId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  linkedinUrl: string;
  phone: string;
  company: string;
  companyIndustry: string;
  companySize: string;
  companyWebsite: string;
  companyLinkedinUrl: string;
}

export default function ApolloSearch() {
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [location, setLocation] = useState("");
  const [technology, setTechnology] = useState("");
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());

  const searchQuery = trpc.apollo.search.useQuery(
    { q, title, industry, companySize, location, technology, page, limit: 20 },
    { enabled: hasSearched }
  );

  const utils = trpc.useUtils();

  const importCrm = trpc.apollo.importToCrm.useMutation({
    onSuccess: () => {
      utils.crm.listContacts.invalidate();
      utils.crm.listCompanies.invalidate();
      toast.success("Imported to CRM");
    },
    onError: (e) => toast.error(e.message),
  });

  const importProspecting = trpc.apollo.importToProspecting.useMutation({
    onSuccess: () => {
      utils.prospecting.list.invalidate();
      utils.prospecting.stats.invalidate();
      toast.success("Imported to Prospecting");
    },
    onError: (e) => toast.error(e.message),
  });

  const importPipeline = trpc.apollo.importToPipeline.useMutation({
    onSuccess: () => {
      toast.success("Imported to Pipeline");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSearch = () => {
    setPage(1);
    setHasSearched(true);
  };

  const handleImport = async (lead: ApolloLead, target: "crm" | "prospecting" | "pipeline") => {
    setImportingIds(prev => new Set(prev).add(lead.apolloId));
    try {
      if (target === "crm") await importCrm.mutateAsync(lead as any);
      else if (target === "prospecting") await importProspecting.mutateAsync(lead as any);
      else await importPipeline.mutateAsync(lead as any);
    } finally {
      setImportingIds(prev => {
        const next = new Set(prev);
        next.delete(lead.apolloId);
        return next;
      });
    }
  };

  const contacts = searchQuery.data?.contacts ?? [];
  const pagination = searchQuery.data?.pagination;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#e5e5e5]">Apollo B2B Lead Search</h1>
            <p className="text-sm text-[#666] mt-0.5">
              Search millions of verified contacts and companies from Apollo.io
            </p>
          </div>
          <a href="/integrations">
            <Button variant="outline" size="sm" className="border-[#333] text-[#888]">
              Configure API Key
            </Button>
          </a>
        </div>

        {/* Filters */}
        <Card className="bg-[#111] border-[#2a2a2a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#e5e5e5] flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#f5c842]" /> Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#666] mb-1 block">Keywords</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]" />
                  <Input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="e.g. Stripe, Salesforce..."
                    className="pl-8 bg-[#1a1a1a] border-[#333] text-[#e5e5e5] placeholder:text-[#555]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#666] mb-1 block">Title</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. CEO, VP Marketing..."
                  className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] placeholder:text-[#555]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#666] mb-1 block">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]" />
                  <Input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="pl-8 bg-[#1a1a1a] border-[#333] text-[#e5e5e5] placeholder:text-[#555]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#666] mb-1 block">Technology</label>
                <Input
                  value={technology}
                  onChange={e => setTechnology(e.target.value)}
                  placeholder="e.g. HubSpot, AWS..."
                  className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] placeholder:text-[#555]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#666] mb-1 block">Industry</label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5]">
                    <SelectValue placeholder="Any industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    <SelectItem value="" className="text-[#e5e5e5]">Any industry</SelectItem>
                    {INDUSTRIES.map(i => (
                      <SelectItem key={i} value={i} className="text-[#e5e5e5]">{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#666] mb-1 block">Company Size</label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5]">
                    <SelectValue placeholder="Any size" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    <SelectItem value="" className="text-[#e5e5e5]">Any size</SelectItem>
                    {COMPANY_SIZES.map(s => (
                      <SelectItem key={s.value} value={s.value} className="text-[#e5e5e5]">{s.label} employees</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={searchQuery.isFetching}
              className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90 font-semibold"
            >
              {searchQuery.isFetching ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4 mr-1" />
              )}
              Search Apollo
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#f5c842]" />
                <span className="text-sm text-[#e5e5e5] font-medium">
                  {pagination?.total_entries ?? 0} leads found
                </span>
              </div>
              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm" variant="ghost"
                    disabled={page <= 1 || searchQuery.isFetching}
                    onClick={() => setPage(p => p - 1)}
                    className="text-[#888] hover:text-[#e5e5e5]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-[#666] px-2">
                    Page {page} of {pagination.total_pages}
                  </span>
                  <Button
                    size="sm" variant="ghost"
                    disabled={page >= pagination.total_pages || searchQuery.isFetching}
                    onClick={() => setPage(p => p + 1)}
                    className="text-[#888] hover:text-[#e5e5e5]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {searchQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-[#1a1a1a] animate-pulse rounded-lg border border-[#2a2a2a]" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-16 text-[#555]">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No leads found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {contacts.map((lead: ApolloLead) => {
                  const isImporting = importingIds.has(lead.apolloId);
                  return (
                    <Card key={lead.apolloId} className="bg-[#111] border-[#2a2a2a] hover:border-[#f5c842]/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[#e5e5e5] text-sm">{lead.name}</span>
                              {lead.title && (
                                <Badge variant="secondary" className="bg-[#1a1a1a] text-[#888] text-[10px] border-[#333]">
                                  <Briefcase className="w-2.5 h-2.5 mr-1" />
                                  {lead.title}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-[#666] flex-wrap">
                              {lead.company && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {lead.company}
                                </span>
                              )}
                              {lead.companyIndustry && (
                                <Badge className="bg-blue-900/30 text-blue-300 text-[10px] border-blue-900/50">
                                  {lead.companyIndustry}
                                </Badge>
                              )}
                              {lead.companySize && (
                                <Badge className="bg-emerald-900/30 text-emerald-300 text-[10px] border-emerald-900/50">
                                  {lead.companySize}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                              {lead.email && (
                                <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-[#888] hover:text-[#f5c842] transition-colors">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </a>
                              )}
                              {lead.phone && (
                                <span className="flex items-center gap-1 text-[#888]">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </span>
                              )}
                              {lead.linkedinUrl && (
                                <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                                  <Linkedin className="w-3 h-3" />
                                  LinkedIn
                                </a>
                              )}
                              {lead.companyWebsite && (
                                <a href={lead.companyWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#888] hover:text-[#f5c842]">
                                  <Globe className="w-3 h-3" />
                                  Website
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 border-[#333] text-[#e5e5e5] hover:bg-[#f5c842] hover:text-black hover:border-[#f5c842]"
                              disabled={isImporting}
                              onClick={() => handleImport(lead, "crm")}
                            >
                              {isImporting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                              CRM
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 border-[#333] text-[#e5e5e5] hover:bg-[#f5c842] hover:text-black hover:border-[#f5c842]"
                              disabled={isImporting}
                              onClick={() => handleImport(lead, "pipeline")}
                            >
                              Pipeline
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 border-[#333] text-[#e5e5e5] hover:bg-[#f5c842] hover:text-black hover:border-[#f5c842]"
                              disabled={isImporting}
                              onClick={() => handleImport(lead, "prospecting")}
                            >
                              Prospect
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {pagination && pagination.total_pages > 1 && (
              <div className="flex justify-center gap-1 pt-2">
                <Button
                  size="sm" variant="ghost"
                  disabled={page <= 1 || searchQuery.isFetching}
                  onClick={() => setPage(p => p - 1)}
                  className="text-[#888] hover:text-[#e5e5e5]"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-xs text-[#666] px-3 self-center">
                  Page {page} of {pagination.total_pages}
                </span>
                <Button
                  size="sm" variant="ghost"
                  disabled={page >= pagination.total_pages || searchQuery.isFetching}
                  onClick={() => setPage(p => p + 1)}
                  className="text-[#888] hover:text-[#e5e5e5]"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
