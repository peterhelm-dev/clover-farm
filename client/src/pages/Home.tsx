import React, { useState, useEffect, useRef, useCallback } from "react";
import { AIChatBox } from "@/components/AIChatBox";
import { useAuth } from "@/_core/hooks/useAuth";
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
  ChevronLeft, Send, SkipForward, Loader2, Wheat
} from "lucide-react";
import { toast } from "sonner";
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

type OnboardStep = "age" | "weight" | "diet" | "allergies" | "conditions" | "done";

const ONBOARD_STEPS: OnboardStep[] = ["age", "weight", "diet", "allergies", "conditions", "done"];

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

  // ---- UI state ----
  const [activeTab, setActiveTab] = useState<"dashboard" | "voice-logger" | "calendar" | "recipes" | "travel" | "integrations">("dashboard");

  // ---- onboarding wizard ----
  const [onboardStep, setOnboardStep] = useState<OnboardStep>("age");
  const [onboardAge, setOnboardAge] = useState("");
  const [onboardWeight, setOnboardWeight] = useState("");
  const [onboardDiet, setOnboardDiet] = useState<string[]>([]);
  const [onboardAllergies, setOnboardAllergies] = useState<string[]>([]);
  const [onboardConditions, setOnboardConditions] = useState<string[]>([]);

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
      // Final step — save to DB
      try {
        await saveProfileMutation.mutateAsync({
          age: onboardAge ? parseInt(onboardAge) : undefined,
          weightLbs: onboardWeight ? parseFloat(onboardWeight) : undefined,
          dietaryChoices: onboardDiet,
          allergies: onboardAllergies,
          healthConditions: onboardConditions,
          onboardingComplete: 1,
        });
        toast.success("Welcome to Clover! Your profile is ready.");
        setOnboardStep("done");
      } catch {
        toast.error("Failed to save profile. Please try again.");
      }
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
    } catch {
      addChatMsg({ role: "ai", text: "Sorry, analysis failed. Please try again." });
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
                disabled={saveProfileMutation.isPending}
                className="gap-2"
              >
                {saveProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : onboardStep === "conditions" ? (
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
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground font-sans">

      {/* ---- Sidebar ---- */}
      <aside className="w-full md:w-64 bg-card border-r border-border/40 flex flex-col justify-between shrink-0">
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
              { id: "travel" as const, label: "Travel Sourcing", icon: Compass, pulse: false },
              { id: "integrations" as const, label: "Integrations", icon: Smartphone, pulse: false },
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
        </div>

        <div className="p-6 border-t border-border/40">
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

      {/* ---- Main content ---- */}
      <main className="flex-1 bg-muted/10 p-6 md:p-10 overflow-y-auto">

        {/* ===== A. DASHBOARD ===== */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 max-w-5xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">Your Health Habits</h2>
                <p className="text-xs text-muted-foreground mt-1">Real-time daily tracking powered by AI voice-logging.</p>
              </div>
              <Button onClick={() => setActiveTab("voice-logger")} className="gap-1.5 text-xs">
                <Mic className="h-3.5 w-3.5" /> Log Food
              </Button>
            </div>

            {/* Macro progress cards — 5 cards including fiber */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-border/60 lg:col-span-2">
                <CardHeader className="p-5 border-b border-border/40">
                  <CardTitle className="font-serif text-base font-bold">7-Day Calorie Trend</CardTitle>
                  <CardDescription className="text-xs">Your actual intake vs. daily target.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 h-64">
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
                <CardHeader className="p-5 border-b border-border/40">
                  <CardTitle className="font-serif text-base font-bold">Macro Split (Today)</CardTitle>
                  <CardDescription className="text-xs">Energy distribution in calories.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 flex flex-col items-center justify-center h-64">
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
                      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <div className="font-bold text-sm flex items-center gap-2">
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
                          {log.rawSpeech && <p className="text-[10px] text-muted-foreground italic">"{log.rawSpeech}"</p>}
                        </div>
                        <div className="flex gap-3 text-xs font-mono shrink-0">
                          <div><strong>{Math.round(Number(log.calories))}</strong> kcal</div>
                          <div><strong>{Math.round(Number(log.protein))}g</strong> P</div>
                          <div><strong>{Math.round(Number(log.carbs))}g</strong> C</div>
                          <div><strong>{Math.round(Number(log.fat))}g</strong> F</div>
                          <div className="text-violet-600"><strong>{Math.round(Number(log.fiber))}g</strong> Fb</div>
                        </div>
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
          <div className="space-y-8 max-w-5xl">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">Curated Recipes</h2>
              <p className="text-xs text-muted-foreground mt-1">Grounded in seasonal USDA Zone 5b crop calendars and customised to your dietary preferences.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80", label: "Breakfast", title: "Spring Farmstand Scramble", time: "20 mins", items: ["4 Pastured Eggs", "2 cups Spinach", "1 cup Shiitake Mushrooms"] },
                { img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80", label: "Dinner", title: "Heirloom Tomato & Basil Galette", time: "55 mins", items: ["3 Heirloom Tomatoes", "1 tbsp Wildflower Honey"] },
                { img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80", label: "Dinner", title: "Orchard Apple & Kale Warm Salad", time: "25 mins", items: ["4 cups Baby Kale", "1 Macintosh Apple"] },
              ].map(r => (
                <Card key={r.title} className="border-border/60 overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className="h-44 bg-muted relative">
                    <img src={r.img} alt={r.title} className="object-cover w-full h-full" />
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px]">{r.label}</Badge>
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="font-serif text-base font-bold leading-tight">{r.title}</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3.5 w-3.5" />{r.time}
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {r.items.map(item => (
                        <li key={item} className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ===== E. TRAVEL SOURCING ===== */}
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

      </main>
    </div>
  );
}
