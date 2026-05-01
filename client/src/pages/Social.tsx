import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Sparkles,
  Calendar,
  FileText,
  Settings2,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  BookOpen,
  Zap,
} from "lucide-react";
import { SkeletonRows } from "@/components/StateUI";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-4 h-4 text-blue-500" />,
  twitter: <Twitter className="w-4 h-4 text-sky-400" />,
  instagram: <Instagram className="w-4 h-4 text-pink-500" />,
  facebook: <Facebook className="w-4 h-4 text-blue-600" />,
};

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  twitter: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  facebook: "bg-blue-600/10 text-blue-300 border-blue-600/20",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  pending_approval: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

// ─── AI Generator Dialog ──────────────────────────────────────────────────────
function AIGeneratorDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<"linkedin" | "twitter" | "instagram" | "facebook">("linkedin");
  const [tone, setTone] = useState<"professional" | "casual" | "thought_leader" | "educational">("professional");
  const [variations, setVariations] = useState<Array<{ content: string; hashtags: string[] }>>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const generate = trpc.social.posts.generateWithAI.useMutation({
    onSuccess: (data) => {
      setVariations(data.variations);
      setSelectedIdx(0);
    },
    onError: (e) => toast.error(e.message),
  });

  const createPost = trpc.social.posts.create.useMutation({
    onSuccess: () => {
      toast.success("Post saved as draft");
      setOpen(false);
      setVariations([]);
      setPrompt("");
      onCreated();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
          <Sparkles className="w-4 h-4" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-ivory flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            AI Post Generator
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter / X</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="thought_leader">Thought Leader</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">What should the post be about?</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Share a tip about closing high-ticket clients, or announce a new service offer..."
              className="bg-zinc-800 border-zinc-700 text-ivory min-h-[80px] resize-none"
            />
          </div>

          <Button
            onClick={() => generate.mutate({ prompt, platform, tone, count: 3 })}
            disabled={!prompt.trim() || generate.isPending}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            {generate.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating 3 variations...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generate 3 Variations</>
            )}
          </Button>

          {variations.length > 0 && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-xs">Select a variation to save:</p>
              {variations.map((v, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedIdx === i
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <p className="text-ivory text-sm whitespace-pre-wrap">{v.content}</p>
                  {v.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {v.hashtags.map((h, j) => (
                        <span key={j} className="text-violet-400 text-xs">#{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <Button
                onClick={() => {
                  if (selectedIdx === null) return;
                  const v = variations[selectedIdx];
                  createPost.mutate({
                    platform,
                    content: v.content,
                    hashtags: v.hashtags,
                    aiGenerated: true,
                    aiPrompt: prompt,
                    status: "draft",
                  });
                }}
                disabled={selectedIdx === null || createPost.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {createPost.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />Save Selected as Draft</>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Post Dialog ───────────────────────────────────────────────────────
function CreatePostDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"linkedin" | "twitter" | "instagram" | "facebook">("linkedin");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const createPost = trpc.social.posts.create.useMutation({
    onSuccess: () => {
      toast.success("Post created");
      setOpen(false);
      setContent("");
      setHashtags("");
      setScheduledFor("");
      onCreated();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-zinc-700 text-ivory hover:bg-zinc-800">
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-ivory">Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-ivory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">Twitter / X</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post..."
              className="bg-zinc-800 border-zinc-700 text-ivory min-h-[120px] resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Hashtags (comma separated)</Label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="marketing, business, growth"
              className="bg-zinc-800 border-zinc-700 text-ivory"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Schedule For (optional)</Label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-ivory"
            />
          </div>
          <Button
            onClick={() =>
              createPost.mutate({
                platform,
                content,
                hashtags: hashtags
                  .split(",")
                  .map((h) => h.trim())
                  .filter(Boolean),
                scheduledFor: scheduledFor || undefined,
              })
            }
            disabled={!content.trim() || createPost.isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {createPost.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
            ) : scheduledFor ? (
              <><Calendar className="w-4 h-4 mr-2" />Schedule Post</>
            ) : (
              <><FileText className="w-4 h-4 mr-2" />Save as Draft</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Strategy Config Dialog ───────────────────────────────────────────────────
function StrategyDialog({ onUpdated }: { onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const { data: strategy } = trpc.social.strategy.get.useQuery();
  const [platforms, setPlatforms] = useState<string[]>(["linkedin"]);
  const [topics, setTopics] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "thought_leader" | "educational">("professional");
  const [postsPerWeek, setPostsPerWeek] = useState(5);

  const upsert = trpc.social.strategy.upsert.useMutation({
    onSuccess: () => {
      toast.success("Strategy saved");
      onUpdated();
    },
    onError: (e) => toast.error(e.message),
  });

  const generateWeekly = trpc.social.strategy.generateWeeklyContent.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.count} posts — check your Approval Queue`);
      setOpen(false);
      onUpdated();
    },
    onError: (e) => toast.error(e.message),
  });

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-zinc-700 text-ivory hover:bg-zinc-800">
          <Settings2 className="w-4 h-4" />
          Strategy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-ivory flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Autonomous Content Strategy
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {strategy?.lastGeneratedAt && (
            <div className="bg-zinc-800 rounded-lg p-3 text-xs text-zinc-400">
              Last generated: {new Date(strategy.lastGeneratedAt).toLocaleDateString()}
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Active Platforms</Label>
            <div className="flex gap-2">
              {(["linkedin", "twitter", "instagram", "facebook"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs transition-all ${
                    platforms.includes(p)
                      ? PLATFORM_COLORS[p]
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  {PLATFORM_ICONS[p]}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Content Topics (comma separated)</Label>
            <Input
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="client acquisition, mindset, case studies, offers"
              className="bg-zinc-800 border-zinc-700 text-ivory"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="thought_leader">Thought Leader</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Posts / Week</Label>
              <Input
                type="number"
                min={1}
                max={21}
                value={postsPerWeek}
                onChange={(e) => setPostsPerWeek(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-ivory"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                upsert.mutate({
                  platforms,
                  topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
                  tone,
                  postsPerWeek,
                  isActive: true,
                })
              }
              disabled={upsert.isPending}
              className="flex-1 border-zinc-700 text-ivory hover:bg-zinc-800"
            >
              Save Strategy
            </Button>
            <Button
              onClick={() =>
                generateWeekly.mutate({
                  platforms,
                  topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
                  tone,
                  postsPerWeek,
                })
              }
              disabled={generateWeekly.isPending || platforms.length === 0}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {generateWeekly.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" />Generate Week</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({
  post,
  onUpdate,
}: {
  post: {
    id: number;
    platform: string;
    content: string;
    hashtags: unknown;
    status: string;
    approvalStatus: string | null;
    scheduledFor: Date | null;
    aiGenerated: boolean;
    createdAt: Date;
  };
  onUpdate: () => void;
}) {
  const utils = trpc.useUtils();
  const deletePost = trpc.social.posts.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      onUpdate();
    },
  });
  const approve = trpc.social.posts.approve.useMutation({
    onSuccess: () => {
      toast.success("Post approved");
      onUpdate();
    },
  });

  const hashtags = Array.isArray(post.hashtags) ? (post.hashtags as string[]) : [];

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {PLATFORM_ICONS[post.platform]}
            <span className="text-zinc-400 text-xs capitalize">{post.platform}</span>
            {post.aiGenerated && (
              <span className="flex items-center gap-1 text-violet-400 text-xs">
                <Sparkles className="w-3 h-3" />AI
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-xs ${STATUS_COLORS[post.status] ?? ""}`}
            >
              {post.status === "pending_approval" ? "Pending" : post.status}
            </Badge>
          </div>
        </div>

        <p className="text-ivory text-sm leading-relaxed line-clamp-4 whitespace-pre-wrap">
          {post.content}
        </p>

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hashtags.slice(0, 5).map((h, i) => (
              <span key={i} className="text-violet-400 text-xs">#{h}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-zinc-500 text-xs">
            {post.scheduledFor ? (
              <><Clock className="w-3 h-3" />{new Date(post.scheduledFor).toLocaleDateString()}</>
            ) : (
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {post.status === "pending_approval" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => approve.mutate({ id: post.id, approved: true })}
                  className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => approve.mutate({ id: post.id, approved: false })}
                  className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deletePost.mutate({ id: post.id })}
              className="h-7 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
            >
              ×
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Social Page ─────────────────────────────────────────────────────────
export default function Social() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: posts, isLoading, refetch } = trpc.social.posts.list.useQuery({
    status: "all",
    platform: "all",
    limit: 100,
  });

  const { data: accounts } = trpc.social.accounts.list.useQuery();
  const { data: library } = trpc.social.library.list.useQuery();

  const stats = {
    total: posts?.length ?? 0,
    drafts: posts?.filter((p) => p.status === "draft").length ?? 0,
    scheduled: posts?.filter((p) => p.status === "scheduled").length ?? 0,
    pending: posts?.filter((p) => p.status === "pending_approval").length ?? 0,
    published: posts?.filter((p) => p.status === "published").length ?? 0,
  };

  const filteredPosts =
    activeTab === "all"
      ? posts ?? []
      : (posts ?? []).filter((p) =>
          activeTab === "pending" ? p.status === "pending_approval" : p.status === activeTab
        );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ivory">Social Media Agents</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            AI-powered content creation and scheduling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StrategyDialog onUpdated={refetch} />
          <CreatePostDialog onCreated={refetch} />
          <AIGeneratorDialog onCreated={refetch} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Posts", value: stats.total, color: "text-ivory" },
          { label: "Drafts", value: stats.drafts, color: "text-zinc-400" },
          { label: "Scheduled", value: stats.scheduled, color: "text-amber-400" },
          { label: "Pending Review", value: stats.pending, color: "text-violet-400" },
          { label: "Published", value: stats.published, color: "text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connected Accounts */}
      {accounts && accounts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-500 text-xs">Connected:</span>
          {accounts.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${PLATFORM_COLORS[a.platform]}`}
            >
              {PLATFORM_ICONS[a.platform]}
              {a.accountName}
              {a.followerCount ? (
                <span className="opacity-60">· {a.followerCount.toLocaleString()}</span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Posts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-800 border border-zinc-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-ivory">
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-ivory">
            Approval Queue ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-ivory">
            Scheduled ({stats.scheduled})
          </TabsTrigger>
          <TabsTrigger value="draft" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-ivory">
            Drafts ({stats.drafts})
          </TabsTrigger>
          <TabsTrigger value="published" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-ivory">
            Published ({stats.published})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <SkeletonRows rows={4} />
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">No posts yet</p>
              <p className="text-zinc-600 text-xs mt-1">
                Use AI Generate to create your first batch of content
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onUpdate={refetch} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Content Library */}
      {library && library.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-ivory text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Content Library ({library.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {library.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-zinc-800 rounded-lg border border-zinc-700"
                >
                  <p className="text-ivory text-sm font-medium">{item.title}</p>
                  <p className="text-zinc-500 text-xs mt-0.5 capitalize">{item.category}</p>
                  <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{item.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
