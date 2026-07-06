import React, { useState, useEffect, useRef, useCallback } from "react";
import { AIChatBox } from "@/components/AIChatBox";
import { ImageMealLogger } from "@/components/ImageMealLogger";
import { WaterIntakeCard } from "@/components/WaterIntakeCard";
import { MealPlanningTab } from "@/components/MealPlanningTab";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDashboardTab } from "@/contexts/DashboardTabContext";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, Calendar, Check, Leaf, Clock,
  Mic, MicOff, BrainCircuit, Heart, AlertTriangle, Apple, Compass,
  LogOut, Activity, BarChart3, Bell, RefreshCw, Smartphone, ChevronRight,
  ChevronLeft, Send, SkipForward, Loader2, Wheat, Trash2, Pencil, Crown, X, CreditCard,
  Share2, Copy, Gift, Shield
} from "lucide-react";
import { toast } from "sonner";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from "recharts";
import { MOCK_TRAVEL_CALENDAR } from "@shared/const";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ChatMessage = {
  id: string;
  role: "user" | "ai" | "system";
  text: string;
  confidence?: "high" | "medium" | "low";
  logSaved?: boolean;
};

type OnboardStep = "age" | "weight" | "diet" | "allergies" | "conditions" | "referral" | "done";

const ONBOARD_STEPS: OnboardStep[] = ["age", "weight", "diet", "allergies", "conditions", "referral", "done"];

const DIET_OPTIONS = ["Balanced", "Vegetarian", "Vegan", "Keto", "Paleo", "High Protein", "Low Carb"];
const ALLERGEN_OPTIONS = ["Peanuts", "Tree Nuts", "Gluten", "Dairy", "Soy", "Shellfish", "Eggs"];
const CONDITION_OPTIONS = ["None", "Diabetes", "Hypertension", "High Cholesterol", "Acid Reflux"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function todayUTCRange() {
  const now = Date.now();
  const d = new Date(now);
  const start = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return { start, end: start + 86400000 - 1, nowMs: now };
}

function confidenceColor(c: "high" | "medium" | "low") {
  if (c === "high") return "border-emerald-300 text-emerald-700 bg-emerald-50";
  if (c === "medium") return "border-amber-300 text-amber-700 bg-amber-50";
  return "border-red-300 text-red-700 bg-red-50";
}

// ---------------------------------------------------------------------------
// ReferralCard sub-component
// ---------------------------------------------------------------------------
function ReferralCard() {
  const { data, isLoading } = trpc.referral.getMyReferrals.useQuery();
  const applyCode = trpc.referral.applyCode.useMutation({
    onSuccess: (res) => {
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    },
  });
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!data?.code) return;
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (!data?.code) return;
    const url = `${window.location.origin}?ref=${data.code}`;
    navigator.clipboard.writeText(url);
    toast.success("Referral link copied!");
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="p-5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <CardTitle className="font-serif text-base">Refer Friends, Earn Free Months</CardTitle>
        </div>
        <CardDescription className="text-xs mt-1">
          Share your code and earn 1 free Pro month for every friend who signs up.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* My referral code */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Referral Code</p>
            {isLoading ? (
              <div className="h-10 bg-muted animate-pulse rounded-lg" />
            ) : (
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted rounded-lg px-4 py-2 font-mono text-lg font-bold tracking-widest text-center">
                  {data?.code ?? "—"}
                </code>
                <Button variant="outline" size="icon" onClick={copyCode} title="Copy code">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={shareLink} title="Copy share link">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span><strong className="text-foreground">{data?.totalReferrals ?? 0}</strong> friends referred</span>
              <span><strong className="text-foreground">{data?.freeMonthsRemaining ?? 0}</strong> free months earned</span>
            </div>
          </div>

          {/* Apply a referral code */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Have a Friend's Code?</p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter referral code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                className="font-mono uppercase text-sm"
                maxLength={16}
              />
              <Button
                size="sm"
                disabled={applyCode.isPending || codeInput.length < 4}
                onClick={() => applyCode.mutate({ code: codeInput })}
              >
                {applyCode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">You can only apply one referral code. Your friend earns a free month too.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// RecipesTab sub-component (keeps recipe state isolated)
// ---------------------------------------------------------------------------
function RecipesTab({ profile }: { profile: { dietaryChoices?: string[] | null; allergies?: string[] | null } | null | undefined }) {
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("healthy");
  const [selectedRecipe, setSelectedRecipe] = useState<null | {
    label: string; image: string; source: string; url: string;
    calories: number; protein: number; carbs: number; fat: number; fiber: number;
    totalTime: number; cuisineType: string[]; mealType: string[];
    dietLabels: string[]; healthLabels: string[];
    ingredientLines: string[];
  }>(null);

  const configuredQuery = trpc.recipes.isConfigured.useQuery();
  const recipesQuery = trpc.recipes.search.useQuery(
    { query },
    { enabled: configuredQuery.data?.configured === true }
  );

  const isConfigured = configuredQuery.data?.configured;
  const recipes = recipesQuery.data?.recipes ?? [];
  const isLoading = recipesQuery.isLoading && configuredQuery.data?.configured;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchInput.trim()) setQuery(searchInput.trim());
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">Curated Recipes</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isConfigured
              ? "Live recipes from Edamam, filtered to your dietary profile."
              : "Connect Edamam to get 2M+ recipes filtered to your dietary preferences."}
          </p>
        </div>
        {isConfigured && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search recipes…"
              className="w-48 h-8 text-xs"
            />
            <Button type="submit" size="sm" className="h-8 text-xs">Search</Button>
          </form>
        )}
      </div>

      {/* Not configured — show setup prompt */}
      {!isConfigured && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
              <Apple className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-lg font-bold">Connect Edamam Recipe API</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Edamam provides access to 2M+ recipes with full nutritional data, filtered automatically
              by your dietary choices and allergens. A free developer account gives you 10,000 calls/month.
            </p>
            <ol className="text-xs text-left max-w-sm mx-auto space-y-2 text-muted-foreground">
              <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Sign up at <a href="https://developer.edamam.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">developer.edamam.com</a></li>
              <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Create a "Recipe Search API" application</li>
              <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Copy your App ID and App Key</li>
              <li className="flex gap-2"><span className="font-bold text-primary">4.</span> Add them as <code className="bg-muted px-1 rounded">EDAMAM_APP_ID</code> and <code className="bg-muted px-1 rounded">EDAMAM_APP_KEY</code> in Settings → Secrets</li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Recipe grid */}
      {isConfigured && !isLoading && recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map(r => (
            <Card
              key={r.id}
              className="border-border/60 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedRecipe(r)}
            >
              <div className="h-44 bg-muted relative overflow-hidden">
                {r.image ? (
                  <img src={r.image} alt={r.label} className="object-cover w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Apple className="h-10 w-10 opacity-30" />
                  </div>
                )}
                {r.totalTime > 0 && (
                  <Badge className="absolute top-3 right-3 bg-black/60 text-white border-0 text-[10px]">
                    <Clock className="h-3 w-3 mr-1" />{r.totalTime} min
                  </Badge>
                )}
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="font-serif text-sm font-bold leading-tight line-clamp-2">{r.label}</CardTitle>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.source}</p>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="grid grid-cols-4 gap-1 text-center">
                  {[{ label: "Cal", val: r.calories }, { label: "Pro", val: r.protein + "g" }, { label: "Carb", val: r.carbs + "g" }, { label: "Fat", val: r.fat + "g" }].map(m => (
                    <div key={m.label} className="bg-muted/40 rounded-lg py-1.5">
                      <div className="text-xs font-bold">{m.val}</div>
                      <div className="text-[9px] text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.healthLabels.slice(0, 3).map(h => (
                    <span key={h} className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full">{h}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isConfigured && !isLoading && recipes.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Apple className="h-10 w-10 mx-auto opacity-30 mb-3" />
          <p className="text-sm">No recipes found for "{query}". Try a different search.</p>
        </div>
      )}

      {/* Recipe detail modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedRecipe(null)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto border-border/60 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="h-52 bg-muted relative overflow-hidden">
              {selectedRecipe.image && <img src={selectedRecipe.image} alt={selectedRecipe.label} className="object-cover w-full h-full" />}
              <button onClick={() => setSelectedRecipe(null)} className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                <X className="h-4 w-4" />
              </button>
            </div>
            <CardHeader className="p-5 border-b border-border/40">
              <CardTitle className="font-serif text-lg font-bold">{selectedRecipe.label}</CardTitle>
              <p className="text-xs text-muted-foreground">{selectedRecipe.source}</p>
              <div className="grid grid-cols-5 gap-2 mt-3">
                {[{ label: "Cal", val: selectedRecipe.calories }, { label: "Protein", val: selectedRecipe.protein + "g" }, { label: "Carbs", val: selectedRecipe.carbs + "g" }, { label: "Fat", val: selectedRecipe.fat + "g" }, { label: "Fiber", val: selectedRecipe.fiber + "g" }].map(m => (
                  <div key={m.label} className="bg-muted/40 rounded-lg py-2 text-center">
                    <div className="text-sm font-bold">{m.val}</div>
                    <div className="text-[9px] text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ingredients</h4>
                <ul className="space-y-1">
                  {selectedRecipe.ingredientLines.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />{line}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={selectedRecipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full gap-2 text-xs">
                  View Full Recipe <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();

  // ---- DB queries ----
  const { start: todayStart, nowMs } = todayUTCRange();
  const [todayMs] = useState(() => nowMs);
  const todayLogsQuery = trpc.foodLogs.getByDate.useQuery(
    { dateMs: todayMs },
    { enabled: isAuthenticated }
  );
  const profileQuery = trpc.foodLogs.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const allLogsQuery = trpc.foodLogs.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // ---- mutations ----
  const saveLogMutation = trpc.foodLogs.create.useMutation({
    onSuccess: () => {
      utils.foodLogs.getByDate.invalidate();
      utils.foodLogs.getAll.invalidate();
    },
  });
  const saveProfileMutation = trpc.foodLogs.saveProfile.useMutation({
    onSuccess: () => utils.foodLogs.getProfile.invalidate(),
  });
  const analyzeTranscript = trpc.nutrition.analyzeTranscript.useMutation();
  const healthOverviewMutation = trpc.healthInsights.overview.useMutation();
  const healthChatMutation = trpc.healthInsights.chat.useMutation();
  const deleteLogMutation = trpc.foodLogs.delete.useMutation({
    onSuccess: () => {
      utils.foodLogs.getByDate.invalidate();
      utils.foodLogs.getAll.invalidate();
      toast.success("Log entry deleted.");
    },
    onError: () => toast.error("Failed to delete log."),
  });
  const updateLogMutation = trpc.foodLogs.update.useMutation({
    onSuccess: () => {
      utils.foodLogs.getByDate.invalidate();
      utils.foodLogs.getAll.invalidate();
      setEditingLogId(null);
      toast.success("Log updated.");
    },
    onError: () => toast.error("Failed to update log."),
  });
  const downgradeToFreeMutation = trpc.billing.downgradeToFree.useMutation({
    onSuccess: () => {
      subscriptionQuery.refetch();
      toast.success("Downgraded to Free plan.");
    },
    onError: () => toast.error("Failed to downgrade. Please try again."),
  });
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) window.open(data.checkoutUrl, "_blank");
    },
    onError: () => toast.error("Could not start checkout. Please try again."),
  });
  const applyReferralCodeMutation = trpc.referral.applyCode.useMutation();
  const subscriptionQuery = trpc.billing.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // ---- UI state ----
  const [activeTab, setActiveTab] = useState<"dashboard" | "voice-logger" | "calendar" | "recipes" | "mealplan" | "travel" | "integrations" | "billing">("dashboard");
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ foodName: string; quantity: string; calories: string; protein: string; carbs: string; fat: string; fiber: string }>({ foodName: "", quantity: "", calories: "", protein: "", carbs: "", fat: "", fiber: "" });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ---- onboarding wizard ----
  const [onboardStep, setOnboardStep] = useState<OnboardStep>("age");
  const [onboardAge, setOnboardAge] = useState("");
  const [onboardWeight, setOnboardWeight] = useState("");
  const [onboardDiet, setOnboardDiet] = useState<string[]>([]);
  const [onboardAllergies, setOnboardAllergies] = useState<string[]>([]);
  const [onboardConditions, setOnboardConditions] = useState<string[]>([]);
  const [onboardReferralCode, setOnboardReferralCode] = useState("");

  // ---- voice logger chat ----
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [awaitingClarification, setAwaitingClarification] = useState(false);
  const [speechErrorTip, setSpeechErrorTip] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ---- calendar ----
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [calendarDayMs, setCalendarDayMs] = useState<number | null>(null);
  const calendarDayQuery = trpc.foodLogs.getByDate.useQuery(
    { dateMs: calendarDayMs ?? todayMs },
    { enabled: isAuthenticated && calendarDayMs !== null }
  );

  // ---- integrations ----
  const [integrations, setIntegrations] = useState({ appleHealth: false, googleCalendar: false, myFitnessPal: false });

  // ---- AI health overview ----
  const [overviewText, setOverviewText] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(false);

  // ---- data-aware AI chat panel ----
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<{ role: "system" | "user" | "assistant"; content: string }[]>([
    { role: "system", content: "You are Clover, a friendly nutrition coach. Answer questions about the user's food logs." },
  ]);

  const handleAiChatSend = useCallback(async (content: string) => {
    const newMessages = [...aiChatMessages, { role: "user" as const, content }];
    setAiChatMessages(newMessages);
    try {
      const result = await healthChatMutation.mutateAsync({
        messages: newMessages
          .filter(m => m.role !== "system")
          .map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      });
      setAiChatMessages(prev => [...prev, { role: "assistant" as const, content: String(result.reply) }]);
    } catch {
      setAiChatMessages(prev => [...prev, { role: "assistant" as const, content: "Sorry, I couldn't fetch a response. Please try again." }]);
    }
  }, [aiChatMessages, healthChatMutation]);

  // ---- recording timer ----
  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (isRecording) {
      t = setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(t);
  }, [isRecording]);

  // ---- auto-scroll chat ----
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ---- derived values ----
  const dbLogs = todayLogsQuery.data ?? [];
  const profile = profileQuery.data;
  const calorieTarget = profile?.calorieTarget ?? 2000;
  const proteinTarget = profile?.proteinTarget ?? 120;
  const carbsTarget = profile?.carbsTarget ?? 200;
  const fatTarget = profile?.fatTarget ?? 65;
  const fiberTarget = profile?.fiberTarget ?? 28;

  const dailyTotals = dbLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + Number(l.calories),
      protein: acc.protein + Number(l.protein),
      carbs: acc.carbs + Number(l.carbs),
      fat: acc.fat + Number(l.fat),
      fiber: acc.fiber + Number(l.fiber),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const pieData = [
    { name: "Protein", value: Math.round(dailyTotals.protein * 4), color: "#10b981" },
    { name: "Carbs", value: Math.round(dailyTotals.carbs * 4), color: "#3b82f6" },
    { name: "Fat", value: Math.round(dailyTotals.fat * 9), color: "#f59e0b" },
  ];

  // ---- chart data from all logs (last 7 days) ----
  const chartData = React.useMemo(() => {
    const days: { name: string; Calories: number; Target: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = dayStart + 86400000;
      const dayLogs = (allLogsQuery.data ?? []).filter(l => {
        const t = typeof l.loggedAt === "number" ? l.loggedAt : new Date(l.loggedAt).getTime();
        return t >= dayStart && t < dayEnd;
      });
      const cal = dayLogs.reduce((s, l) => s + Number(l.calories), 0);
      days.push({
        name: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
        Calories: Math.round(cal),
        Target: calorieTarget,
      });
    }
    return days;
  }, [allLogsQuery.data, calorieTarget]);

  // ---- allergen list from profile ----
  const knownAllergies: string[] = profile?.allergies ?? [];

  // ---- onboarding check ----
  const needsOnboarding = isAuthenticated && !authLoading && !profileQuery.isLoading && !profile?.onboardingComplete;

  // ---------------------------------------------------------------------------
  // Onboarding handlers
  // ---------------------------------------------------------------------------
  const onboardStepIndex = ONBOARD_STEPS.indexOf(onboardStep);

  const advanceOnboard = async () => {
    const next = ONBOARD_STEPS[onboardStepIndex + 1];
    if (onboardStep === "conditions") {
      // Save profile, then advance to referral step
      try {
        await saveProfileMutation.mutateAsync({
          age: onboardAge ? parseInt(onboardAge) : undefined,
          weightLbs: onboardWeight ? parseFloat(onboardWeight) : undefined,
          dietaryChoices: onboardDiet,
          allergies: onboardAllergies,
          healthConditions: onboardConditions,
          onboardingComplete: 1,
        });
        setOnboardStep("referral");
      } catch {
        toast.error("Failed to save profile. Please try again.");
      }
    } else if (onboardStep === "referral") {
      // Apply referral code if provided, then finish
      if (onboardReferralCode.trim().length >= 4) {
        try {
          const res = await applyReferralCodeMutation.mutateAsync({ code: onboardReferralCode.trim() });
          if (res.success) toast.success(res.message);
          else toast.error(res.message);
        } catch {
          // Non-blocking — continue to dashboard even if code fails
        }
      }
      toast.success("Welcome to Clover! Your profile is ready.");
      setOnboardStep("done");
    } else {
      setOnboardStep(next);
    }
  };

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  // ---------------------------------------------------------------------------
  // Voice logger / chat handlers
  // ---------------------------------------------------------------------------
  const addChatMsg = useCallback((msg: Omit<ChatMessage, "id">) => {
    setChatMessages(prev => [...prev, { ...msg, id: `${Date.now()}-${Math.random()}` }]);
  }, []);

  const processText = useCallback(async (text: string, clarificationCtx?: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeTranscript.mutateAsync({
        transcript: text,
        clarificationContext: clarificationCtx,
        knownAllergies,
      });

      if (result.clarifyingQuestion) {
        setAwaitingClarification(true);
        setPendingTranscript(text);
        addChatMsg({
          role: "ai",
          text: result.clarifyingQuestion,
          confidence: result.confidence,
        });
      } else {
        // Save to DB
        await saveLogMutation.mutateAsync({
          rawSpeech: clarificationCtx ? `${text} | Clarified: ${clarificationCtx}` : text,
          foodName: result.foodName,
          quantity: result.quantity,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          fiber: result.fiber ?? 0,
          allergensDetected: result.allergensDetected,
          confidence: result.confidence,
          notes: result.notes ?? undefined,
        });
        setAwaitingClarification(false);
        setPendingTranscript("");

        const allergenWarning = result.allergensDetected.length > 0
          ? ` ⚠️ Allergen alert: ${result.allergensDetected.join(", ")}.`
          : "";
        addChatMsg({
          role: "ai",
          text: `Logged **${result.foodName}** — ${Math.round(result.calories)} kcal | ${Math.round(result.protein)}g protein | ${Math.round(result.carbs)}g carbs | ${Math.round(result.fat)}g fat | ${Math.round(result.fiber ?? 0)}g fiber.${result.notes ? `\n\n_${result.notes}_` : ""}${allergenWarning}`,
          confidence: result.confidence,
          logSaved: true,
        });
      }
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("AI call limit") || msg.includes("Upgrade")) {
        setShowUpgradeModal(true);
        addChatMsg({ role: "ai", text: "You've reached your free tier limit (10 AI logs/month). Upgrade to Clover Plus for unlimited logging! 🌿" });
      } else {
        addChatMsg({ role: "ai", text: "Sorry, analysis failed. Please try again." });
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeTranscript, saveLogMutation, addChatMsg, knownAllergies]);

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || isAnalyzing) return;
    setChatInput("");

    addChatMsg({ role: "user", text });

    if (awaitingClarification) {
      await processText(pendingTranscript, text);
    } else {
      await processText(text);
    }
  };

  const handleSkipClarification = async () => {
    if (!pendingTranscript) return;
    addChatMsg({ role: "user", text: "Skip — use average estimate" });
    await processText(pendingTranscript, "User skipped clarification, use average estimates.");
  };

  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSpeechErrorTip("Web Speech API not supported in this browser. Use the text input below.");
      toast.error("Microphone not supported — use the text box.");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let final = "";
    rec.onstart = () => { setIsRecording(true); setSpeechErrorTip(null); };
    rec.onerror = (e: any) => {
      setIsRecording(false);
      if (e.error === "network") {
        setSpeechErrorTip("Chrome's cloud speech service was blocked. Use the text input instead.");
      } else {
        setSpeechErrorTip(`Mic error: ${e.error}. Check browser permissions.`);
      }
    };
    rec.onend = () => setIsRecording(false);
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setChatInput(final + interim);
    };
    rec.start();
    recognitionRef.current = rec;
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setTimeout(() => {
      setChatInput(prev => {
        if (prev.trim()) {
          // auto-send after stopping
          const text = prev.trim();
          setChatInput("");
          addChatMsg({ role: "user", text });
          if (awaitingClarification) {
            processText(pendingTranscript, text);
          } else {
            processText(text);
          }
        } else {
          toast.warning("No speech detected.");
        }
        return "";
      });
    }, 600);
  };

  // ---------------------------------------------------------------------------
  // Calendar helpers
  // ---------------------------------------------------------------------------
  function calendarDays() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, year, month };
  }

  const logsByDay = React.useMemo(() => {
    const map: Record<string, number> = {};
    (allLogsQuery.data ?? []).forEach(l => {
      const d = new Date(typeof l.loggedAt === "number" ? l.loggedAt : Number(l.loggedAt));
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map[key] = (map[key] ?? 0) + Number(l.calories);
    });
    return map;
  }, [allLogsQuery.data]);

  // ---------------------------------------------------------------------------
  // Auth loading
  // ---------------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 1. LOGIN WALL
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-transparent to-transparent px-4">
        <div className="w-full max-w-md space-y-8 bg-card border border-border/40 p-8 rounded-2xl shadow-xl">
          <div className="text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Leaf className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-serif font-bold tracking-tight">Clover Wellness</h2>
            <p className="text-sm text-muted-foreground">
              The zero-friction, voice-activated wellness and seasonal meal companion.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="w-full h-11 gap-3"
          >
            <Leaf className="h-5 w-5" />
            Sign in with Manus
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to Clover's curated wellness terms.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. ONBOARDING WIZARD (step-by-step)
  // ---------------------------------------------------------------------------
  if (needsOnboarding) {
    const stepIdx = ONBOARD_STEPS.indexOf(onboardStep);
    const totalSteps = ONBOARD_STEPS.length - 1; // exclude "done"
    const progressPct = Math.round((stepIdx / totalSteps) * 100);

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Progress bar */}
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Setting up your profile</span>
              <span>{stepIdx} / {totalSteps}</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>

          <Card className="border-border/60 shadow-lg">
            <CardHeader className="p-6 border-b border-border/40">
              <div className="flex items-center gap-2 text-primary font-serif font-bold text-lg">
                <Leaf className="h-5 w-5" /> Welcome to Clover
              </div>
              <CardDescription className="text-xs mt-1">
                Let's personalise your wellness engine. You can always update this later.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6 min-h-[200px]">
              {onboardStep === "age" && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl font-bold">How old are you?</h3>
                  <p className="text-sm text-muted-foreground">Used to calibrate your daily calorie and macro targets.</p>
                  <Input
                    type="number"
                    placeholder="e.g. 28"
                    value={onboardAge}
                    onChange={e => setOnboardAge(e.target.value)}
                    className="text-lg h-12 max-w-xs"
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") advanceOnboard(); }}
                  />
                </div>
              )}
              {onboardStep === "weight" && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl font-bold">What's your current weight?</h3>
                  <p className="text-sm text-muted-foreground">In pounds (lbs). Helps us estimate your protein needs.</p>
                  <Input
                    type="number"
                    placeholder="e.g. 155"
                    value={onboardWeight}
                    onChange={e => setOnboardWeight(e.target.value)}
                    className="text-lg h-12 max-w-xs"
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") advanceOnboard(); }}
                  />
                </div>
              )}
              {onboardStep === "diet" && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl font-bold">What's your dietary style?</h3>
                  <p className="text-sm text-muted-foreground">Select all that apply.</p>
                  <div className="flex flex-wrap gap-2">
                    {DIET_OPTIONS.map(d => (
                      <Button
                        key={d}
                        type="button"
                        variant={onboardDiet.includes(d) ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOnboardDiet(toggleArr(onboardDiet, d))}
                        className="rounded-full h-8 px-4 text-xs"
                      >{d}</Button>
                    ))}
                  </div>
                </div>
              )}
              {onboardStep === "allergies" && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl font-bold">Any food allergies or sensitivities?</h3>
                  <p className="text-sm text-muted-foreground">Clover AI will flag these in every meal analysis.</p>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGEN_OPTIONS.map(a => (
                      <Button
                        key={a}
                        type="button"
                        variant={onboardAllergies.includes(a) ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => setOnboardAllergies(toggleArr(onboardAllergies, a))}
                        className="rounded-full h-8 px-4 text-xs"
                      >{a}</Button>
                    ))}
                  </div>
                </div>
              )}
              {onboardStep === "conditions" && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl font-bold">Any health conditions to note?</h3>
                  <p className="text-sm text-muted-foreground">Helps Clover tailor nutritional notes and alerts.</p>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_OPTIONS.map(c => (
                      <Button
                        key={c}
                        type="button"
                        variant={onboardConditions.includes(c) ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOnboardConditions(toggleArr(onboardConditions, c))}
                        className="rounded-full h-8 px-4 text-xs"
                      >{c}</Button>
                    ))}
                  </div>
                </div>
              )}
              {onboardStep === "referral" && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl font-bold">Got a referral code?</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter a friend's referral code to earn a free month of Clover Plus.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="e.g. CLOVER-ABC123"
                      value={onboardReferralCode}
                      onChange={e => setOnboardReferralCode(e.target.value.toUpperCase())}
                      onKeyDown={e => { if (e.key === "Enter") advanceOnboard(); }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 tracking-widest font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => advanceOnboard()}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                      Skip — I don't have a code
                    </button>
                  </div>
                </div>
              )}
            </CardContent>

            <div className="px-6 pb-6 flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => {
                  if (stepIdx > 0) setOnboardStep(ONBOARD_STEPS[stepIdx - 1]);
                }}
                disabled={stepIdx === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={advanceOnboard}
                disabled={saveProfileMutation.isPending || applyReferralCodeMutation.isPending}
                className="gap-2"
              >
                {(saveProfileMutation.isPending || applyReferralCodeMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : onboardStep === "conditions" ? (
                  <>Next <ChevronRight className="h-4 w-4" /></>
                ) : onboardStep === "referral" ? (
                  <>Finish Setup <Check className="h-4 w-4" /></>
                ) : (
                  <>Next <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. MAIN APP
  // ---------------------------------------------------------------------------
  return (
    <SidebarProvider>
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground font-sans w-full">

      {/* ---- Sidebar (desktop fixed, mobile drawer) ---- */}
      <Sidebar collapsible="offcanvas" className="border-r border-border/40">
      <aside className="w-full bg-card flex flex-col justify-between h-full">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            <span>Clover AI</span>
          </div>

          {/* User summary */}
          <div className="p-4 bg-muted/30 rounded-xl border border-border/40 space-y-1">
            <div className="text-xs font-bold text-foreground">{user?.name ?? "Wellness Explorer"}</div>
            <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1">
              {(profile?.dietaryChoices ?? []).map(d => (
                <span key={d} className="bg-primary/5 px-1.5 py-0.5 rounded text-primary">{d}</span>
              ))}
              {(profile?.allergies ?? []).map(a => (
                <span key={a} className="bg-destructive/10 px-1.5 py-0.5 rounded text-destructive">{a}</span>
              ))}
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {([
              { id: "dashboard" as const, label: "Habits Dashboard", icon: BarChart3, pulse: false },
              { id: "voice-logger" as const, label: "Voice Food Logger", icon: Mic, pulse: true },
              { id: "calendar" as const, label: "Calendar View", icon: Calendar, pulse: false },
              { id: "recipes" as const, label: "Curated Recipes", icon: Apple, pulse: false },
              { id: "mealplan" as const, label: "Meal Planning", icon: Wheat, pulse: false },
              { id: "travel" as const, label: "Travel Sourcing", icon: Compass, pulse: false },
              { id: "integrations" as const, label: "Integrations", icon: Smartphone, pulse: false },
          { id: "billing" as const, label: "Manage Plan", icon: CreditCard, pulse: false },
            ]).map(({ id, label, icon: Icon, pulse }) => (
              <Button
                key={id}
                variant={activeTab === id ? "secondary" : "ghost"}
                className="w-full justify-start gap-2.5 text-xs font-medium relative"
                onClick={() => setActiveTab(id)}
              >
                <Icon className="h-4 w-4" /> {label}
                {pulse && <span className="absolute right-3 top-2.5 h-2 w-2 rounded-full bg-primary animate-pulse" />}
              </Button>
            ))}
          </nav>

          {/* Admin link — only visible to admins */}
          {user?.role === "admin" && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <a
                href="/admin"
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-md text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </a>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border/40 space-y-3">
          {/* Subscription badge */}
          {subscriptionQuery.data && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
              <span className="flex items-center gap-1.5">
                <Crown className="h-3 w-3 text-amber-500" />
                <span className="font-semibold capitalize">{subscriptionQuery.data.tier}</span>
              </span>
              <span>{subscriptionQuery.data.aiCallsUsed} / {subscriptionQuery.data.aiCallsLimit === Infinity ? "∞" : subscriptionQuery.data.aiCallsLimit} AI calls</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </Button>
        </div>
      </aside>
      </Sidebar>

      {/* ---- Main content ---- */}
      <SidebarInset className="flex-1 bg-muted/10 overflow-y-auto">
        {/* Mobile sticky header with hamburger */}
        <header className="sticky top-0 z-20 flex md:hidden items-center gap-3 bg-background/95 backdrop-blur border-b border-border/40 px-4 py-3">
          <SidebarTrigger className="h-8 w-8" />
          <div className="flex items-center gap-2 font-serif font-bold text-primary">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="text-sm">Clover AI</span>
          </div>
          <div className="ml-auto text-xs text-muted-foreground capitalize font-medium">{activeTab.replace("-", " ")}</div>
        </header>
        <div className="p-6 md:p-10">

        {/* ===== A. DASHBOARD ===== */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 max-w-5xl">

            {/* ---- Trial countdown banner ---- */}
            {(() => {
              const sub = subscriptionQuery.data;
              if (!sub?.trialEndsAt) return null;
              const trialEnd = new Date(sub.trialEndsAt);
              const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000));
              if (daysLeft <= 0) return null;
              return (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⏳</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        {daysLeft} day{daysLeft !== 1 ? "s" : ""} left on your free Plus trial
                      </p>
                      <p className="text-xs text-amber-600">Upgrade before {trialEnd.toLocaleDateString()} to keep unlimited AI logging.</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shrink-0" onClick={() => setActiveTab("billing")}>
                    Upgrade Now
                  </Button>
                </div>
              );
            })()}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">Your Health Habits</h2>
                <p className="text-xs text-muted-foreground mt-1">Real-time daily tracking powered by AI voice-logging.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
                <ImageMealLogger onSuccess={() => todayLogsQuery.refetch()} />
                <Button onClick={() => setActiveTab("voice-logger")} className="gap-1.5 text-xs h-11 sm:h-auto min-w-11 sm:min-w-0">
                  <Mic className="h-4 w-4" /> Log Food
                </Button>
              </div>
            </div>

            {/* Macro progress cards — 5 cards including fiber */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {[
                { label: "Calories", value: Math.round(dailyTotals.calories), target: calorieTarget, unit: "kcal", color: "text-foreground" },
                { label: "Protein", value: Math.round(dailyTotals.protein), target: proteinTarget, unit: "g", color: "text-emerald-600" },
                { label: "Carbs", value: Math.round(dailyTotals.carbs), target: carbsTarget, unit: "g", color: "text-blue-600" },
                { label: "Fat", value: Math.round(dailyTotals.fat), target: fatTarget, unit: "g", color: "text-amber-600" },
                { label: "Fiber", value: Math.round(dailyTotals.fiber), target: fiberTarget, unit: "g", color: "text-violet-600" },
              ].map(({ label, value, target, unit, color }) => (
                <Card key={label} className="border-border/60">
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</CardDescription>
                    <CardTitle className="font-serif text-xl font-bold mt-1">
                      {value}<span className="text-xs text-muted-foreground font-normal ml-1">{unit}</span>
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground">/ {target} {unit}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Progress value={Math.min((value / target) * 100, 100)} className="h-1.5" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <WaterIntakeCard />
              
              <Card className="border-border/60 md:col-span-2 lg:col-span-2">
                <CardHeader className="p-4 sm:p-5 border-b border-border/40">
                  <CardTitle className="font-serif text-sm sm:text-base font-bold">7-Day Calorie Trend</CardTitle>
                  <CardDescription className="text-xs">Your actual intake vs. daily target.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#888" fontSize={11} />
                      <YAxis stroke="#888" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="Calories" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCal)" />
                      <Area type="monotone" dataKey="Target" stroke="#10b981" strokeDasharray="5 5" strokeWidth={1.5} fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="p-4 sm:p-5 border-b border-border/40">
                  <CardTitle className="font-serif text-sm sm:text-base font-bold">Macro Split (Today)</CardTitle>
                  <CardDescription className="text-xs">Energy distribution in calories.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center h-48 sm:h-64">
                  {dailyTotals.calories > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                            {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex gap-4 text-xs mt-4">
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Protein</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-500" /> Carbs</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-500" /> Fat</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-2 text-muted-foreground">
                      <BrainCircuit className="h-8 w-8 mx-auto stroke-1" />
                      <p className="text-xs">No food logged today. Use the voice logger!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Today's log list */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold">Today's Logs</h3>
              {todayLogsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </div>
              ) : dbLogs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border/60 rounded-xl text-muted-foreground">
                  <Mic className="h-8 w-8 mx-auto mb-3 stroke-1" />
                  <p className="text-sm font-medium">No logs yet today</p>
                  <p className="text-xs mt-1">Tap "Log Food" or visit the Voice Logger to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dbLogs.map(log => (
                    <Card key={log.id} className="border-border/60">
                      <CardContent className="p-4">
                        {editingLogId === log.id ? (
                          /* ---- Inline edit form ---- */
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="col-span-2">
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Food Name</label>
                                <Input value={editForm.foodName} onChange={e => setEditForm(p => ({ ...p, foodName: e.target.value }))} className="h-8 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Qty</label>
                                <Input value={editForm.quantity} onChange={e => setEditForm(p => ({ ...p, quantity: e.target.value }))} className="h-8 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Calories</label>
                                <Input type="number" value={editForm.calories} onChange={e => setEditForm(p => ({ ...p, calories: e.target.value }))} className="h-8 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Protein (g)</label>
                                <Input type="number" value={editForm.protein} onChange={e => setEditForm(p => ({ ...p, protein: e.target.value }))} className="h-8 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Carbs (g)</label>
                                <Input type="number" value={editForm.carbs} onChange={e => setEditForm(p => ({ ...p, carbs: e.target.value }))} className="h-8 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Fat (g)</label>
                                <Input type="number" value={editForm.fat} onChange={e => setEditForm(p => ({ ...p, fat: e.target.value }))} className="h-8 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Fiber (g)</label>
                                <Input type="number" value={editForm.fiber} onChange={e => setEditForm(p => ({ ...p, fiber: e.target.value }))} className="h-8 text-sm mt-0.5" />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingLogId(null)}>
                                <X className="h-3.5 w-3.5 mr-1" /> Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="text-xs"
                                disabled={updateLogMutation.isPending}
                                onClick={() => updateLogMutation.mutate({
                                  id: log.id,
                                  foodName: editForm.foodName,
                                  quantity: editForm.quantity,
                                  calories: parseFloat(editForm.calories) || 0,
                                  protein: parseFloat(editForm.protein) || 0,
                                  carbs: parseFloat(editForm.carbs) || 0,
                                  fat: parseFloat(editForm.fat) || 0,
                                  fiber: parseFloat(editForm.fiber) || 0,
                                })}
                              >
                                {updateLogMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />} Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* ---- Normal view ---- */
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            {log.imageUrl && (
                              <div className="shrink-0">
                                <img
                                  src={log.imageUrl}
                                  alt={log.foodName}
                                  className="w-16 h-16 rounded-lg object-cover border border-border/60"
                                />
                              </div>
                            )}
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                                {log.foodName}
                                {(log.allergensDetected as string[]).length > 0 && (
                                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">
                                    ⚠️ {(log.allergensDetected as string[]).join(", ")}
                                  </Badge>
                                )}
                                {log.confidence && (
                                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0.5 ${confidenceColor(log.confidence as "high" | "medium" | "low")}`}>
                                    {log.confidence}
                                  </Badge>
                                )}
                              </div>
                              {log.quantity && <p className="text-xs text-muted-foreground">Qty: {log.quantity}</p>}
                              {log.rawSpeech && <p className="text-[10px] text-muted-foreground italic truncate max-w-xs">"{log.rawSpeech}"</p>}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex gap-3 text-xs font-mono shrink-0">
                                <div><strong>{Math.round(Number(log.calories))}</strong> kcal</div>
                                <div><strong>{Math.round(Number(log.protein))}g</strong> P</div>
                                <div className="hidden sm:block"><strong>{Math.round(Number(log.carbs))}g</strong> C</div>
                                <div className="hidden sm:block"><strong>{Math.round(Number(log.fat))}g</strong> F</div>
                                <div className="hidden sm:block text-violet-600"><strong>{Math.round(Number(log.fiber))}g</strong> Fb</div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setEditingLogId(log.id);
                                    setEditForm({
                                      foodName: log.foodName,
                                      quantity: log.quantity ?? "",
                                      calories: String(Math.round(Number(log.calories))),
                                      protein: String(Math.round(Number(log.protein))),
                                      carbs: String(Math.round(Number(log.carbs))),
                                      fat: String(Math.round(Number(log.fat))),
                                      fiber: String(Math.round(Number(log.fiber))),
                                    });
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  disabled={deleteLogMutation.isPending}
                                  onClick={() => deleteLogMutation.mutate({ id: log.id })}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* ===== AI Health Overview Panel ===== */}
            <div className="mt-2">
              <Card className="border-border/60">
                <CardHeader className="p-5 border-b border-border/40 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-serif text-base font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" /> AI Health Overview
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">A personalised daily summary and improvement tips from Clover AI.</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      setShowOverview(true);
                      try {
                        const result = await healthOverviewMutation.mutateAsync();
                        setOverviewText(String(result.overview));
                      } catch {
                        setOverviewText("Failed to generate overview. Please try again.");
                      }
                    }}
                    disabled={healthOverviewMutation.isPending}
                    className="gap-1.5 text-xs"
                  >
                    {healthOverviewMutation.isPending ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                    ) : (
                      <><RefreshCw className="h-3.5 w-3.5" /> {overviewText ? "Refresh" : "Generate"}</>
                    )}
                  </Button>
                </CardHeader>
                {showOverview && (
                  <CardContent className="p-5">
                    {healthOverviewMutation.isPending && !overviewText ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Analysing your food logs...
                      </div>
                    ) : overviewText ? (
                      <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed">
                        {overviewText.split("\n").map((line, i) => (
                          <p key={i} className={line.startsWith("**") ? "font-semibold mt-3 mb-1" : "mb-1"}>
                            {line.replace(/\*\*/g, "")}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Click "Generate" to get your personalised daily overview.</p>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>

            {/* ===== Referral Card ===== */}
            <ReferralCard />

          </div>
        )}

        {/* ===== Floating AI Chat Button (visible on dashboard) ===== */}
        {isAuthenticated && activeTab === "dashboard" && (
          <>
            {/* Floating button */}
            <button
              onClick={() => setShowAiChat(prev => !prev)}
              className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-150"
              title="Ask Clover AI about your nutrition"
            >
              <BrainCircuit className="h-6 w-6" />
            </button>

            {/* Chat panel */}
            {showAiChat && (
              <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 shadow-2xl rounded-2xl overflow-hidden border border-border/60 bg-card flex flex-col" style={{ height: "420px" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Ask Clover AI</span>
                  </div>
                  <button onClick={() => setShowAiChat(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <AIChatBox
                    messages={aiChatMessages}
                    onSendMessage={handleAiChatSend}
                    isLoading={healthChatMutation.isPending}
                    height="100%"
                    placeholder="Ask about your nutrition..."
                    emptyStateMessage="Ask me anything about your food logs!"
                    suggestedPrompts={[
                      "How many calories did I have today?",
                      "What was my highest-protein meal?",
                      "Am I hitting my fiber target?",
                    ]}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== B. VOICE LOGGER (chat-style) ===== */}
        {activeTab === "voice-logger" && (
          <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-4">
              <h2 className="text-2xl font-serif font-bold">Voice Food Logger</h2>
              <p className="text-xs text-muted-foreground mt-1">Speak or type what you ate. Clover AI will extract the nutrition and save it to your log.</p>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1">
              {chatMessages.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Mic className="h-10 w-10 mx-auto mb-3 stroke-1" />
                  <p className="text-sm font-medium">Start logging your food</p>
                  <p className="text-xs mt-1">Try: "I had oatmeal with banana and a coffee"</p>
                </div>
              )}
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border border-border/60 text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.role === "ai" && msg.confidence && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                        <Badge variant="outline" className={`text-[9px] ${confidenceColor(msg.confidence)}`}>
                          {msg.confidence} confidence
                        </Badge>
                        {msg.logSaved && <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">Saved</Badge>}
                      </div>
                    )}
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isAnalyzing && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing with USDA data...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Skip clarification */}
            {awaitingClarification && !isAnalyzing && (
              <div className="mb-2 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground gap-1.5"
                  onClick={handleSkipClarification}
                >
                  <SkipForward className="h-3.5 w-3.5" /> Skip — use average estimate
                </Button>
              </div>
            )}

            {/* Speech error tip */}
            {speechErrorTip && (
              <div className="mb-2 p-3 bg-destructive/5 border border-destructive/10 rounded-lg text-xs text-muted-foreground flex gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                {speechErrorTip}
              </div>
            )}

            {/* Input bar */}
            <div className="flex gap-2 items-center border border-border/60 rounded-2xl bg-card px-3 py-2">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                  isRecording
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
                title={isRecording ? `Stop (${recordingDuration}s)` : "Start recording"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder={awaitingClarification ? "Answer the question above..." : "What did you eat?"}
                className="border-0 shadow-none focus-visible:ring-0 text-sm bg-transparent"
                disabled={isAnalyzing}
              />
              <Button
                size="sm"
                onClick={handleSendChat}
                disabled={!chatInput.trim() || isAnalyzing}
                className="shrink-0 h-8 w-8 p-0 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ===== C. CALENDAR VIEW ===== */}
        {activeTab === "calendar" && (
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">
                {calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCalendarDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCalendarDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendar grid */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const { firstDay, daysInMonth, year, month } = calendarDays();
                    const cells = [];
                    for (let i = 0; i < firstDay; i++) {
                      cells.push(<div key={`empty-${i}`} />);
                    }
                    for (let day = 1; day <= daysInMonth; day++) {
                      const key = `${year}-${month}-${day}`;
                      const cal = logsByDay[key] ?? 0;
                      const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                      const dayMs = Date.UTC(year, month, day);
                      const isSelected = calendarDayMs === dayMs;
                      cells.push(
                        <button
                          key={day}
                          onClick={() => setCalendarDayMs(isSelected ? null : dayMs)}
                          className={`relative rounded-lg p-1 text-center text-xs transition-colors hover:bg-muted/50 ${
                            isToday ? "ring-1 ring-primary" : ""
                          } ${isSelected ? "bg-primary/10" : ""}`}
                        >
                          <span className={`block text-sm font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                          {cal > 0 && (
                            <span className="block text-[9px] text-muted-foreground">{Math.round(cal)} kcal</span>
                          )}
                          {cal > 0 && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                          )}
                        </button>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Day detail */}
            {calendarDayMs !== null && (
              <Card className="border-border/60">
                <CardHeader className="p-5 border-b border-border/40">
                  <CardTitle className="font-serif text-base font-bold">
                    {new Date(calendarDayMs).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  {calendarDayQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </div>
                  ) : (calendarDayQuery.data ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No logs for this day.</p>
                  ) : (
                    <div className="space-y-3">
                      {(calendarDayQuery.data ?? []).map(log => (
                        <div key={log.id} className="flex justify-between items-center text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0">
                          <div>
                            <span className="font-medium">{log.foodName}</span>
                            {log.quantity && <span className="text-xs text-muted-foreground ml-2">({log.quantity})</span>}
                          </div>
                          <div className="flex gap-3 text-xs font-mono text-muted-foreground">
                            <span>{Math.round(Number(log.calories))} kcal</span>
                            <span className="text-emerald-600">{Math.round(Number(log.protein))}g P</span>
                            <span className="text-violet-600">{Math.round(Number(log.fiber))}g Fb</span>
                          </div>
                        </div>
                      ))}
                      {/* Day totals */}
                      <div className="pt-2 flex gap-4 text-xs font-mono font-semibold border-t border-border/40">
                        {["calories", "protein", "carbs", "fat", "fiber"].map(k => {
                          const sum = (calendarDayQuery.data ?? []).reduce((s, l) => s + Number((l as any)[k] ?? 0), 0);
                          return <span key={k}>{Math.round(sum)}{k === "calories" ? " kcal" : "g " + k.charAt(0).toUpperCase()}</span>;
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

                {/* ===== D. CURATED RECIPES ===== */}
        {activeTab === "recipes" && (
          <RecipesTab profile={profile} />
        )}
        {/* ===== E. MEAL PLANNING ===== */}
        {activeTab === "mealplan" && (
          <MealPlanningTab />
        )}
        {/* ===== F. TRAVEL SOURCING ===== */}
        {activeTab === "travel" && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">Travel Sourcing</h2>
              <p className="text-xs text-muted-foreground mt-1">Diet-compliant eatery recommendations cross-referenced with your travel calendar.</p>
            </div>
            {MOCK_TRAVEL_CALENDAR.map(travel => (
              <Card key={travel.id} className="border-border/60">
                <CardHeader className="p-5 border-b border-border/40 flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="font-serif text-base font-bold">Travel to {travel.city}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{travel.dateRange}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">Calendar Sync Active</Badge>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {travel.eateries.map((eat, idx) => (
                      <div key={idx} className="p-4 bg-muted/30 rounded-xl border border-border/40 space-y-2">
                        <div className="font-bold text-xs">{eat.name}</div>
                        <div className="text-[10px] text-muted-foreground">{eat.type} • {eat.distance} away</div>
                        <div className="flex flex-wrap gap-1">
                          {eat.dietMatches.map(m => (
                            <span key={m} className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded border border-emerald-100 font-medium">{m}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ===== F. INTEGRATIONS ===== */}
        {activeTab === "integrations" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold">Connected Integrations</h2>
              <p className="text-xs text-muted-foreground">Sync with your existing health ecosystem.</p>
            </div>
            <div className="space-y-4">
              {[
                { key: "appleHealth" as const, icon: Heart, color: "bg-pink-50 text-pink-600", title: "Apple Health & iPhone Fitness Sync", desc: "Import daily activity, active calories burned, and sync profile weight automatically." },
                { key: "googleCalendar" as const, icon: Calendar, color: "bg-blue-50 text-blue-600", title: "Google Calendar Integration", desc: "Scan upcoming travel destinations to prepare dietary eatery recommendations." },
                { key: "myFitnessPal" as const, icon: Activity, color: "bg-orange-50 text-orange-600", title: "MyFitnessPal Sync", desc: "Push voice-logged food and macro metrics directly into your MyFitnessPal journal." },
              ].map(({ key, icon: Icon, color, title, desc }) => (
                <Card key={key} className="border-border/60">
                  <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-4 items-start">
                      <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-sm font-bold">{title}</h3>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    <Button
                      variant={integrations[key] ? "destructive" : "default"}
                      size="sm"
                      onClick={() => {
                        setIntegrations(p => ({ ...p, [key]: !p[key] }));
                        toast.info(integrations[key] ? "Disconnected." : "Feature coming soon — integration not yet live.");
                      }}
                      className="text-xs"
                    >
                      {integrations[key] ? "Disconnect" : "Link Account"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ===== G. BILLING / MANAGE PLAN ===== */}
        {activeTab === "billing" && (
          <div className="max-w-3xl space-y-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">Manage Your Plan</h2>
              <p className="text-xs text-muted-foreground mt-1">Upgrade or manage your Clover subscription.</p>
            </div>

            {/* Current plan status */}
            {subscriptionQuery.data && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-500" />
                      <span className="font-serif font-bold text-base capitalize">Current Plan: Clover {subscriptionQuery.data.tier}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      AI logs used this month: <strong>{subscriptionQuery.data.aiCallsUsed}</strong> / {subscriptionQuery.data.aiCallsLimit === Infinity ? "Unlimited" : subscriptionQuery.data.aiCallsLimit}
                    </p>
                  </div>
                  {subscriptionQuery.data.tier !== "free" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => {
                        if (confirm("Downgrade to the free plan? You will lose unlimited AI logging.")) {
                          downgradeToFreeMutation.mutate(undefined);
                        }
                      }}
                    >
                      Downgrade to Free
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {([
                {
                  tier: "free" as const,
                  name: "Clover Free",
                  price: "$0",
                  period: "forever",
                  features: ["10 AI voice logs / month", "Basic dashboard", "7-day history"],
                  cta: "Current Plan",
                  highlight: false,
                },
                {
                  tier: "plus" as const,
                  name: "Clover Plus",
                  price: "$7.99",
                  period: "/ month",
                  features: ["Unlimited AI voice logs", "Full history & calendar", "AI health overview", "Recipe recommendations"],
                  cta: "Upgrade to Plus",
                  highlight: true,
                },
                {
                  tier: "pro" as const,
                  name: "Clover Pro",
                  price: "$14.99",
                  period: "/ month",
                  features: ["Everything in Plus", "Travel sourcing", "Weekly email digest", "Priority AI", "CSV export"],
                  cta: "Upgrade to Pro",
                  highlight: false,
                },
              ]).map(plan => (
                <Card key={plan.tier} className={`border-border/60 relative ${plan.highlight ? "border-primary ring-1 ring-primary/30" : ""}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-3">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="p-5 border-b border-border/40">
                    <CardTitle className="font-serif text-base font-bold">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-xs text-muted-foreground ml-1">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    {plan.tier === "free" ? (
                      <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                        {subscriptionQuery.data?.tier === "free" ? "Current Plan" : "Downgraded"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full text-xs"
                        variant={plan.highlight ? "default" : "outline"}
                        disabled={checkoutMutation.isPending || subscriptionQuery.data?.tier === plan.tier}
                        onClick={() => {
                          if (subscriptionQuery.data?.tier === plan.tier) return;
                          toast.info("Opening secure checkout...");
                          checkoutMutation.mutate({ tier: plan.tier, billingCycle: "monthly" });
                        }}
                      >
                        {checkoutMutation.isPending ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Processing...</>
                        ) : subscriptionQuery.data?.tier === plan.tier ? (
                          "Current Plan"
                        ) : (
                          plan.cta
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              Test card: 4242 4242 4242 4242 · Any future date · Any CVC. Payments are processed securely by Stripe.
            </p>
          </div>
        )}

      </div>{/* end p-6 inner div */}
      </SidebarInset>

      {/* ===== UPGRADE MODAL ===== */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-primary/30 shadow-2xl">
            <CardHeader className="p-6 border-b border-border/40">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" /> Unlock Unlimited Logging
                  </CardTitle>
                  <CardDescription className="text-xs">
                    You've used all 10 free AI logs this month. Upgrade to keep tracking.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1" onClick={() => setShowUpgradeModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                  <div className="font-serif font-bold text-sm">Clover Plus</div>
                  <div className="text-2xl font-bold">$7.99<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Unlimited AI logs</li>
                    <li className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Full history</li>
                    <li className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> AI health overview</li>
                  </ul>
                  <Button
                    size="sm"
                    className="w-full text-xs mt-2"
                    disabled={checkoutMutation.isPending}
                    onClick={() => {
                      setShowUpgradeModal(false);
                      toast.info("Opening secure checkout...");
                      checkoutMutation.mutate({ tier: "plus", billingCycle: "monthly" });
                    }}
                  >
                    {checkoutMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upgrade to Plus"}
                  </Button>
                </div>
                <div className="p-4 rounded-xl border border-border/60 space-y-2">
                  <div className="font-serif font-bold text-sm">Clover Pro</div>
                  <div className="text-2xl font-bold">$14.99<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Everything in Plus</li>
                    <li className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Travel sourcing</li>
                    <li className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Priority AI</li>
                  </ul>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs mt-2"
                    disabled={checkoutMutation.isPending}
                    onClick={() => {
                      setShowUpgradeModal(false);
                      toast.info("Opening secure checkout...");
                      checkoutMutation.mutate({ tier: "pro", billingCycle: "monthly" });
                    }}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Payments processed securely by Stripe. Cancel anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

    </div>{/* end flex row */}
    </SidebarProvider>
  );
}
