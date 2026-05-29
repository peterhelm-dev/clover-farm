import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  DEFAULT_PROFILE, MOCK_FOOD_LOGS, MOCK_TRAVEL_CALENDAR, UserProfile, FoodLog, TravelDestination 
} from "@shared/const";
import { 
  Sparkles, Calendar, MapPin, Check, ChevronRight, Sprout, ShoppingBag, Leaf, Clock, 
  Award, Mic, MicOff, BrainCircuit, Heart, AlertTriangle, Apple, Compass, Settings, 
  LogOut, Activity, BarChart3, Plus, Bell, RefreshCw, Smartphone, CheckCircle2, Star
} from "lucide-react";
import { toast } from "sonner";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell 
} from "recharts";

export default function Home() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // App data state
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>(MOCK_FOOD_LOGS);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Onboarding wizard form state
  const [onboardForm, setOnboardForm] = useState({
    name: "",
    age: 30,
    weight: 150,
    allergies: [] as string[],
    dietaryChoices: [] as string[],
    healthConditions: [] as string[]
  });

  // Voice recording simulation states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [clarifyingQuestion, setClarifyingQuestion] = useState<string | null>(null);
  const [clarifyingAnswer, setClarifyingAnswer] = useState("");
  const [extractedLog, setExtractedLog] = useState<Partial<FoodLog> | null>(null);

  // Integrations state
  const [integrations, setIntegrations] = useState({
    appleHealth: false,
    googleCalendar: false,
    myFitnessPal: false
  });

  // Notifications state
  const [notifications, setNotifications] = useState<string[]>([
    "Your calorie target for today is set to 2,000 kcal based on your profile.",
    "Gluten warning: Yesterday's lunch contained gluten, which is on your restriction list."
  ]);

  // Voice recording timer effect
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Calculate daily totals for today
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  
  const todayLogs = foodLogs.filter(log => new Date(log.timestamp) >= todayStart);
  
  const dailyTotals = todayLogs.reduce((acc, curr) => ({
    calories: acc.calories + curr.calories,
    protein: acc.protein + curr.protein,
    carbs: acc.carbs + curr.carbs,
    fat: acc.fat + curr.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Handle Google / Apple Auth
  const handleLogin = (provider: string) => {
    toast.success(`Successfully logged in via ${provider}!`);
    setIsAuthenticated(true);
    // Trigger onboarding if first time
    setShowOnboarding(true);
  };

  // Complete onboarding
  const handleOnboardingSubmit = () => {
    const updatedProfile: UserProfile = {
      name: onboardForm.name || "Healthy Explorer",
      age: onboardForm.age,
      weight: onboardForm.weight,
      allergies: onboardForm.allergies.length > 0 ? onboardForm.allergies : ["None"],
      dietaryChoices: onboardForm.dietaryChoices.length > 0 ? onboardForm.dietaryChoices : ["Balanced"],
      healthConditions: onboardForm.healthConditions.length > 0 ? onboardForm.healthConditions : ["None"],
      calorieTarget: 2000,
      proteinTarget: 120,
      carbsTarget: 200,
      fatTarget: 65
    };
    setProfile(updatedProfile);
    setShowOnboarding(false);
    toast.success("Welcome to Clover! Your personalized wellness engine is ready.");
  };

  // Toggle multi-select array in onboarding
  const toggleOnboardArray = (key: "allergies" | "dietaryChoices" | "healthConditions", value: string) => {
    setOnboardForm(prev => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  // Start voice logging simulation
  const startRecording = () => {
    setIsRecording(true);
    setSpeechTranscript("");
    setClarifyingQuestion(null);
    setExtractedLog(null);
    toast.info("Listening... Speak clearly what you ate.");
  };

  // Stop recording and simulate AI analysis
  const stopRecording = () => {
    setIsRecording(false);
    
    // Simulate smart transcripts based on typical entries
    const transcripts = [
      "I had two scrambled eggs with fresh baby spinach and a slice of whole wheat toast",
      "I grabbed a handful of almonds and a medium organic red apple for an afternoon snack",
      "I had a large bowl of homemade lentil soup with some gluten-free crackers"
    ];
    
    const randomTranscript = transcripts[Math.floor(Math.random() * transcripts.length)];
    setSpeechTranscript(randomTranscript);

    toast.info("Processing speech with Clover AI Curation Engine...");

    setTimeout(() => {
      // Analyze transcript to see if we need clarifying questions
      if (randomTranscript.includes("eggs")) {
        setClarifyingQuestion("Clover AI: Did you use any cooking oil or butter for the eggs, or did you scramble them dry?");
        setExtractedLog({
          foodName: "Scrambled Eggs with Spinach & Toast",
          quantity: "2 eggs, 1 cup spinach, 1 slice toast",
          calories: 310,
          protein: 18,
          carbs: 22,
          fat: 14,
          allergensDetected: profile.allergies.includes("Gluten") ? ["Gluten (Toast)"] : []
        });
      } else if (randomTranscript.includes("almonds")) {
        setClarifyingQuestion("Clover AI: Was the apple a small, medium, or large size, and did you have about a handful of almonds?");
        setExtractedLog({
          foodName: "Almonds & Red Apple Snack",
          quantity: "1 oz almonds, 1 medium apple",
          calories: 240,
          protein: 7,
          carbs: 28,
          fat: 15,
          allergensDetected: []
        });
      } else {
        // Direct logging with average defaults
        const newLog: FoodLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          rawSpeech: randomTranscript,
          foodName: "Lentil Soup with Crackers",
          quantity: "1 large bowl, 5 crackers",
          calories: 350,
          protein: 16,
          carbs: 48,
          fat: 8,
          allergensDetected: []
        };
        setFoodLogs(prev => [newLog, ...prev]);
        toast.success("Food logged successfully with average estimates!");
      }
    }, 1500);
  };

  // Submit clarifying answer to adjust log
  const submitClarifyingAnswer = () => {
    if (!extractedLog) return;

    let calorieAdjust = 0;
    let finalQuantity = extractedLog.quantity || "";

    if (clarifyingAnswer.toLowerCase().includes("butter") || clarifyingAnswer.toLowerCase().includes("oil")) {
      calorieAdjust = 100;
      finalQuantity += " (cooked with butter/oil)";
    }

    const newLog: FoodLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      rawSpeech: speechTranscript + " | Clarified: " + clarifyingAnswer,
      foodName: extractedLog.foodName || "Custom Meal",
      quantity: finalQuantity,
      calories: (extractedLog.calories || 200) + calorieAdjust,
      protein: extractedLog.protein || 10,
      carbs: extractedLog.carbs || 20,
      fat: (extractedLog.fat || 5) + (calorieAdjust > 0 ? 11 : 0),
      allergensDetected: extractedLog.allergensDetected || []
    };

    setFoodLogs(prev => [newLog, ...prev]);
    setClarifyingQuestion(null);
    setClarifyingAnswer("");
    setExtractedLog(null);
    toast.success("Log refined and updated in your profile!");
  };

  // Connect Integration simulation
  const toggleIntegration = (key: "appleHealth" | "googleCalendar" | "myFitnessPal") => {
    const isConnected = integrations[key];
    setIntegrations(prev => ({ ...prev, [key]: !isConnected }));
    
    if (!isConnected) {
      toast.success(`Successfully linked to ${key === "appleHealth" ? "Apple Health & iPhone Fitness" : key === "googleCalendar" ? "Google Calendar" : "MyFitnessPal"}!`);
    } else {
      toast.info(`Disconnected from ${key === "appleHealth" ? "Apple Health" : key === "googleCalendar" ? "Google Calendar" : "MyFitnessPal"}.`);
    }
  };

  // Data for Recharts daily calorie trend (last 3 days)
  const chartData = [
    { name: "2 Days Ago", Calories: 1850, Target: profile.calorieTarget },
    { name: "Yesterday", Calories: 2100, Target: profile.calorieTarget },
    { name: "Today", Calories: dailyTotals.calories, Target: profile.calorieTarget }
  ];

  const pieData = [
    { name: "Protein", value: dailyTotals.protein * 4, color: "#10b981" },
    { name: "Carbs", value: dailyTotals.carbs * 4, color: "#3b82f6" },
    { name: "Fat", value: dailyTotals.fat * 9, color: "#f59e0b" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      
      {/* 1. AUTHENTICATION WALL */}
      {!isAuthenticated ? (
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

            <div className="space-y-4 pt-4">
              <Button 
                onClick={() => handleLogin("Google")} 
                variant="outline" 
                className="w-full h-11 gap-3 border-border/60 hover:bg-muted/50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.68 14.9 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.78 2.93c.95-2.85 3.74-4.61 6.98-4.61z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.46 3.59l3.76 2.91c2.2-2.03 3.49-5.01 3.49-8.74z" />
                  <path fill="#FBBC05" d="M5.02 10.65c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.24 7.13C.45 8.76 0 10.58 0 12.5s.45 3.74 1.24 5.37l3.78-3.22z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.5 1.18-4.2 1.18-3.24 0-6.03-1.76-6.98-4.61L1.24 16.58C3.2 20.57 7.24 23 12 23z" />
                </svg>
                Continue with Google
              </Button>

              <Button 
                onClick={() => handleLogin("Apple")} 
                variant="outline" 
                className="w-full h-11 gap-3 border-border/60 hover:bg-muted/50"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.07 2.47.3 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .05-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.1.09 2.23-.57 2.94-1.39z" />
                </svg>
                Continue with Apple
              </Button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border/40"></div>
              <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase tracking-wider">Simulated Sandbox Secure Auth</span>
              <div className="flex-grow border-t border-border/40"></div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to Clover's curated wellness terms.
            </p>
          </div>
        </div>
      ) : showOnboarding ? (
        
        // 2. ONBOARDING WIZARD SCREEN
        <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 py-12">
          <Card className="w-full max-w-2xl border-border/60 shadow-lg">
            <CardHeader className="space-y-2 border-b border-border/40 pb-6">
              <div className="flex items-center gap-2 text-primary font-serif font-bold text-lg">
                <Activity className="h-5 w-5" /> Setup Your Clover Profile
              </div>
              <CardDescription className="text-xs">
                Tell us about your health goals, allergies, and dietary choices. We customize our voice-to-text estimation engine and seasonal recommendations based on this profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Name & Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Your Name</label>
                  <Input 
                    placeholder="Jane Doe" 
                    value={onboardForm.name} 
                    onChange={e => setOnboardForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Age (Years)</label>
                  <Input 
                    type="number" 
                    value={onboardForm.age} 
                    onChange={e => setOnboardForm(prev => ({ ...prev, age: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Weight (lbs)</label>
                  <Input 
                    type="number" 
                    value={onboardForm.weight} 
                    onChange={e => setOnboardForm(prev => ({ ...prev, weight: parseInt(e.target.value) || 150 }))}
                  />
                </div>
              </div>

              {/* Dietary Choices */}
              <div className="space-y-3">
                <label className="text-xs font-semibold block">Dietary Choices (Select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {["Balanced", "Vegetarian", "Vegan", "Keto", "Paleo", "High Protein", "Low Carb"].map(diet => {
                    const active = onboardForm.dietaryChoices.includes(diet);
                    return (
                      <Button 
                        key={diet}
                        type="button"
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleOnboardArray("dietaryChoices", diet)}
                        className="text-xs rounded-full h-8 px-4"
                      >
                        {diet}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Allergens & Sensitivities */}
              <div className="space-y-3">
                <label className="text-xs font-semibold block">Allergies & Sensitivities</label>
                <div className="flex flex-wrap gap-2">
                  {["Peanuts", "Tree Nuts", "Gluten", "Dairy", "Soy", "Shellfish", "Eggs"].map(allergen => {
                    const active = onboardForm.allergies.includes(allergen);
                    return (
                      <Button 
                        key={allergen}
                        type="button"
                        variant={active ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toggleOnboardArray("allergies", allergen)}
                        className="text-xs rounded-full h-8 px-4"
                      >
                        {allergen}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Health Conditions */}
              <div className="space-y-3">
                <label className="text-xs font-semibold block">Health Conditions</label>
                <div className="flex flex-wrap gap-2">
                  {["None", "Diabetes", "Hypertension", "High Cholesterol", "Acid Reflux"].map(condition => {
                    const active = onboardForm.healthConditions.includes(condition);
                    return (
                      <Button 
                        key={condition}
                        type="button"
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleOnboardArray("healthConditions", condition)}
                        className="text-xs rounded-full h-8 px-4"
                      >
                        {condition}
                      </Button>
                    );
                  })}
                </div>
              </div>

            </CardContent>
            <CardFooter className="border-t border-border/40 pt-4 flex justify-end">
              <Button onClick={handleOnboardingSubmit} className="gap-2">
                Create My Account <CheckCircle2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        
        // 3. MAIN APPLICATION INTERFACE (TABS & CORE VIEWS)
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          
          {/* Responsive App Sidebar */}
          <aside className="w-full md:w-64 bg-card border-r border-border/40 flex flex-col justify-between shrink-0">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <span>Clover AI</span>
                </div>
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-mono">V1.2 App</Badge>
              </div>

              {/* User Profile Summary Card */}
              <div className="p-4 bg-muted/30 rounded-xl border border-border/40 space-y-2">
                <div className="text-xs font-bold text-foreground">{profile.name}</div>
                <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1">
                  {profile.dietaryChoices.map(d => <span key={d} className="bg-primary/5 px-1.5 py-0.5 rounded text-primary">{d}</span>)}
                  {profile.allergies.map(a => <span key={a} className="bg-destructive/10 px-1.5 py-0.5 rounded text-destructive">{a}</span>)}
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                <Button 
                  variant={activeTab === "dashboard" ? "secondary" : "ghost"} 
                  className="w-full justify-start gap-2.5 text-xs font-medium"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <BarChart3 className="h-4 w-4" /> Habits Dashboard
                </Button>
                <Button 
                  variant={activeTab === "voice-logger" ? "secondary" : "ghost"} 
                  className="w-full justify-start gap-2.5 text-xs font-medium relative"
                  onClick={() => setActiveTab("voice-logger")}
                >
                  <Mic className="h-4 w-4 text-primary" /> Voice Food Logger
                  <span className="absolute right-3 top-2.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                </Button>
                <Button 
                  variant={activeTab === "recipes" ? "secondary" : "ghost"} 
                  className="w-full justify-start gap-2.5 text-xs font-medium"
                  onClick={() => setActiveTab("recipes")}
                >
                  <Apple className="h-4 w-4" /> Curated Recipes
                </Button>
                <Button 
                  variant={activeTab === "travel" ? "secondary" : "ghost"} 
                  className="w-full justify-start gap-2.5 text-xs font-medium"
                  onClick={() => setActiveTab("travel")}
                >
                  <Compass className="h-4 w-4" /> Travel Sourcing
                </Button>
                <Button 
                  variant={activeTab === "integrations" ? "secondary" : "ghost"} 
                  className="w-full justify-start gap-2.5 text-xs font-medium"
                  onClick={() => setActiveTab("integrations")}
                >
                  <Smartphone className="h-4 w-4" /> Integrations
                </Button>
              </nav>
            </div>

            {/* Logout / Sandbox Reset */}
            <div className="p-6 border-t border-border/40">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsAuthenticated(false)} 
                className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" /> Log Out / Reset Sandbox
              </Button>
            </div>
          </aside>

          {/* Core Content Area */}
          <main className="flex-1 bg-muted/10 p-6 md:p-10 overflow-y-auto">
            
            {/* A. HABITS & INSIGHTS DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-8 max-w-5xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">Your Health Habits</h2>
                    <p className="text-xs text-muted-foreground mt-1">Real-time daily tracking insights powered by frictionless voice-logging.</p>
                  </div>
                  <Button onClick={() => setActiveTab("voice-logger")} className="gap-1.5 text-xs">
                    <Mic className="h-3.5 w-3.5" /> Tap to Voice-Log Food
                  </Button>
                </div>

                {/* Daily Progress Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <Card className="border-border/60">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Calories</CardDescription>
                      <CardTitle className="font-serif text-2xl font-bold mt-1">
                        {dailyTotals.calories} <span className="text-xs text-muted-foreground">/ {profile.calorieTarget} kcal</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Progress value={(dailyTotals.calories / profile.calorieTarget) * 100} className="h-2" />
                    </CardContent>
                  </Card>

                  <Card className="border-border/60">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Protein</CardDescription>
                      <CardTitle className="font-serif text-2xl font-bold mt-1">
                        {dailyTotals.protein}g <span className="text-xs text-muted-foreground">/ {profile.proteinTarget}g</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Progress value={(dailyTotals.protein / profile.proteinTarget) * 100} className="h-2 bg-emerald-100" />
                    </CardContent>
                  </Card>

                  <Card className="border-border/60">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Carbohydrates</CardDescription>
                      <CardTitle className="font-serif text-2xl font-bold mt-1">
                        {dailyTotals.carbs}g <span className="text-xs text-muted-foreground">/ {profile.carbsTarget}g</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Progress value={(dailyTotals.carbs / profile.carbsTarget) * 100} className="h-2 bg-blue-100" />
                    </CardContent>
                  </Card>

                  <Card className="border-border/60">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Fats</CardDescription>
                      <CardTitle className="font-serif text-2xl font-bold mt-1">
                        {dailyTotals.fat}g <span className="text-xs text-muted-foreground">/ {profile.fatTarget}g</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Progress value={(dailyTotals.fat / profile.fatTarget) * 100} className="h-2 bg-amber-100" />
                    </CardContent>
                  </Card>
                </div>

                {/* Interactive Data Visualizations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Calorie Trend Chart */}
                  <Card className="border-border/60 lg:col-span-2">
                    <CardHeader className="p-5 border-b border-border/40">
                      <CardTitle className="font-serif text-base font-bold">Calorie Trend & Daily Targets</CardTitle>
                      <CardDescription className="text-xs">Your calorie trends compared with your profile goals.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                          <YAxis stroke="#888888" fontSize={11} />
                          <Tooltip />
                          <Area type="monotone" dataKey="Calories" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCalories)" />
                          <Area type="monotone" dataKey="Target" stroke="#10b981" strokeDasharray="5 5" strokeWidth={1.5} fill="none" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Macronutrient Distribution */}
                  <Card className="border-border/60">
                    <CardHeader className="p-5 border-b border-border/40">
                      <CardTitle className="font-serif text-base font-bold">Macronutrient Split (Today)</CardTitle>
                      <CardDescription className="text-xs">Energy distribution in calories.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 flex flex-col items-center justify-center h-64">
                      {dailyTotals.calories > 0 ? (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <ResponsiveContainer width="100%" height={140}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex gap-4 text-xs mt-4">
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Protein</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-500" /> Carbs</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-500" /> Fat</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-2 text-muted-foreground">
                          <BrainCircuit className="h-8 w-8 mx-auto stroke-1" />
                          <p className="text-xs">No food logged yet today. Use the voice logger to see insights!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Notifications & Allergens Alerts */}
                <Card className="border-border/60">
                  <CardHeader className="p-5 border-b border-border/40">
                    <CardTitle className="font-serif text-base font-bold flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" /> Relevant Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    {notifications.map((notif, idx) => (
                      <div key={idx} className="flex gap-3 items-start text-xs p-3 rounded-lg bg-muted/30 border border-border/40">
                        {notif.includes("warning") || notif.includes("Gluten") ? (
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        ) : (
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        )}
                        <p className="text-muted-foreground leading-relaxed">{notif}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Food Log History */}
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold">Today's Logs</h3>
                  <div className="space-y-3">
                    {todayLogs.length > 0 ? (
                      todayLogs.map(log => (
                        <Card key={log.id} className="border-border/60">
                          <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                              <div className="font-bold text-sm flex items-center gap-2">
                                {log.foodName}
                                {log.allergensDetected.length > 0 && (
                                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">
                                    Allergen Warning: {log.allergensDetected.join(", ")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">Quantity: {log.quantity}</p>
                              <p className="text-[10px] text-muted-foreground italic">" {log.rawSpeech} "</p>
                            </div>
                            <div className="flex gap-4 text-xs font-mono">
                              <div><strong>{log.calories}</strong> kcal</div>
                              <div><strong>{log.protein}g</strong> P</div>
                              <div><strong>{log.carbs}g</strong> C</div>
                              <div><strong>{log.fat}g</strong> F</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No logs recorded yet today.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* B. VOICE FOOD LOGGER */}
            {activeTab === "voice-logger" && (
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold">Frictionless Voice Logger</h2>
                  <p className="text-xs text-muted-foreground">Simply speak naturally what you ate. Our AI extracts food names, estimates nutritional metrics, and prompts you with smart clarifying questions only when needed.</p>
                </div>

                {/* Visual Voice Button */}
                <Card className="border-border/60 overflow-hidden shadow-lg bg-card flex flex-col items-center justify-center p-8 py-12 text-center space-y-6">
                  {isRecording ? (
                    <div className="space-y-6 w-full flex flex-col items-center">
                      {/* Simulated Audio Wave Animation */}
                      <div className="flex items-center justify-center gap-1.5 h-16 w-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(bar => (
                          <span 
                            key={bar} 
                            className="w-1.5 bg-primary rounded-full animate-pulse" 
                            style={{ 
                              height: `${Math.floor(Math.random() * 40) + 15}px`,
                              animationDelay: `${bar * 100}ms`
                            }} 
                          />
                        ))}
                      </div>
                      <div className="text-sm font-semibold text-primary animate-pulse">
                        Listening... {recordingDuration}s
                      </div>
                      <Button onClick={stopRecording} variant="destructive" size="lg" className="rounded-full h-14 px-8 gap-2">
                        <MicOff className="h-5 w-5" /> Tap to Stop & Analyze
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto hover:scale-105 transition-transform duration-300">
                        <Mic className="h-10 w-10" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-lg font-bold">Ready to Log</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">"I had a bowl of Greek yogurt with fresh blueberries and honey"</p>
                      </div>
                      <Button onClick={startRecording} size="lg" className="rounded-full h-14 px-8 gap-2">
                        <Mic className="h-5 w-5" /> Tap to Start Speaking
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Speech Transcript Output & Clarifying Questions */}
                {speechTranscript && (
                  <Card className="border-border/60 shadow-sm animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <CardHeader className="p-5 border-b border-border/40">
                      <CardTitle className="font-serif text-sm font-bold flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-primary" /> AI Curation & Transcript
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-6">
                      <div className="p-4 bg-muted/30 rounded-lg border border-border/40 text-xs italic text-muted-foreground">
                        "{speechTranscript}"
                      </div>

                      {/* Clarifying Questions */}
                      {clarifyingQuestion ? (
                        <div className="space-y-3 p-4 bg-primary/5 border border-primary/10 rounded-lg">
                          <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> Clarifying Question
                          </h4>
                          <p className="text-xs text-foreground leading-relaxed">{clarifyingQuestion}</p>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Type your answer (e.g. cooked with butter)" 
                              value={clarifyingAnswer}
                              onChange={e => setClarifyingAnswer(e.target.value)}
                              className="text-xs bg-card"
                            />
                            <Button onClick={submitClarifyingAnswer} size="sm" className="text-xs">Submit</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                          <Check className="h-4 w-4 shrink-0" /> Automatically parsed and logged to your profile!
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              </div>
            )}

            {/* C. CURATED RECIPES */}
            {activeTab === "recipes" && (
              <div className="space-y-8 max-w-5xl">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">Curated Recipes</h2>
                  <p className="text-xs text-muted-foreground mt-1">Grounded in seasonal USDA Zone 5b crop calendars and customized to your profile dietary preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Recipe 1 */}
                  <Card className="border-border/60 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div>
                      <div className="h-44 bg-muted relative">
                        <img src="https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80" alt="Scramble" className="object-cover w-full h-full" />
                        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground font-sans text-[10px]">Breakfast</Badge>
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="font-serif text-base font-bold leading-tight">Spring Farmstand Scramble</CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>20 mins total</span>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0 space-y-3">
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block mb-1">Local Ingredients:</span>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" /> 4 large Pastured Eggs</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" /> 2 cups Spinach</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" /> 1 cup Shiitake Mushrooms</li>
                        </ul>
                      </CardContent>
                    </div>
                  </Card>

                  {/* Recipe 2 */}
                  <Card className="border-border/60 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div>
                      <div className="h-44 bg-muted relative">
                        <img src="https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80" alt="Galette" className="object-cover w-full h-full" />
                        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground font-sans text-[10px]">Dinner</Badge>
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="font-serif text-base font-bold leading-tight">Heirloom Tomato & Basil Galette</CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>55 mins total</span>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0 space-y-3">
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block mb-1">Local Ingredients:</span>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" /> 3 medium Heirloom Tomatoes</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" /> 1 tbsp Wildflower Honey</li>
                        </ul>
                      </CardContent>
                    </div>
                  </Card>

                  {/* Recipe 3 */}
                  <Card className="border-border/60 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div>
                      <div className="h-44 bg-muted relative">
                        <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" alt="Apple Salad" className="object-cover w-full h-full" />
                        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground font-sans text-[10px]">Dinner</Badge>
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="font-serif text-base font-bold leading-tight">Orchard Apple & Kale Warm Salad</CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>25 mins total</span>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0 space-y-3">
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block mb-1">Local Ingredients:</span>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" /> 4 cups Baby Kale</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" /> 1 large Macintosh Apple</li>
                        </ul>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* D. TRAVEL SOURCING */}
            {activeTab === "travel" && (
              <div className="space-y-8 max-w-4xl">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">Travel Sourcing</h2>
                  <p className="text-xs text-muted-foreground mt-1">We cross-reference your travel calendar with diet-compliant eateries so you never fall off track while away from home.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {MOCK_TRAVEL_CALENDAR.map(travel => (
                    <Card key={travel.id} className="border-border/60 md:col-span-3">
                      <CardHeader className="p-5 border-b border-border/40 flex flex-row justify-between items-center">
                        <div>
                          <CardTitle className="font-serif text-base font-bold flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" /> Travel to {travel.city}
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5">{travel.dateRange}</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">
                          Calendar Sync Active
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Diet-Compliant Eateries Recommended:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {travel.eateries.map((eat, idx) => (
                            <div key={idx} className="p-4 bg-muted/30 rounded-xl border border-border/40 space-y-2">
                              <div className="font-bold text-xs">{eat.name}</div>
                              <div className="text-[10px] text-muted-foreground">{eat.type} • {eat.distance} away</div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {eat.dietMatches.map(m => (
                                  <span key={m} className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded border border-emerald-100 font-medium">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* E. INTEGRATIONS PANEL */}
            {activeTab === "integrations" && (
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold">Connected Integrations</h2>
                  <p className="text-xs text-muted-foreground">Seamlessly sync with your existing ecosystem. Link your iPhone Health App, Google Calendar, and diet trackers with a single tap.</p>
                </div>

                <div className="space-y-4">
                  {/* Apple Health */}
                  <Card className="border-border/60">
                    <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-4 items-start">
                        <div className="h-12 w-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                          <Heart className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-serif text-sm font-bold">Apple Health & iPhone Fitness Sync</h3>
                          <p className="text-xs text-muted-foreground">Import daily activity, active calories burned, and sync profile weight automatically.</p>
                        </div>
                      </div>
                      <Button 
                        variant={integrations.appleHealth ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleIntegration("appleHealth")}
                        className="text-xs"
                      >
                        {integrations.appleHealth ? "Disconnect" : "Link Account"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Google Calendar */}
                  <Card className="border-border/60">
                    <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-4 items-start">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-serif text-sm font-bold">Google Calendar Integration</h3>
                          <p className="text-xs text-muted-foreground">Scan upcoming travel destinations automatically to prepare dietary eatery recommendations.</p>
                        </div>
                      </div>
                      <Button 
                        variant={integrations.googleCalendar ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleIntegration("googleCalendar")}
                        className="text-xs"
                      >
                        {integrations.googleCalendar ? "Disconnect" : "Link Account"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* MyFitnessPal */}
                  <Card className="border-border/60">
                    <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-4 items-start">
                        <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                          <Activity className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-serif text-sm font-bold">MyFitnessPal Sync</h3>
                          <p className="text-xs text-muted-foreground">Push voice-logged food, calorie counts, and macro metrics directly into your MyFitnessPal journal.</p>
                        </div>
                      </div>
                      <Button 
                        variant={integrations.myFitnessPal ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleIntegration("myFitnessPal")}
                        className="text-xs"
                      >
                        {integrations.myFitnessPal ? "Disconnect" : "Link Account"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

          </main>
        </div>
      )}

    </div>
  );
}
