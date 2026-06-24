import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import {
  Mic,
  BarChart3,
  CalendarDays,
  ChefHat,
  MessageSquare,
  Smartphone,
  Check,
  Leaf,
  Zap,
  Shield,
  Star,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: Mic,
    title: "Voice-First Logging",
    description:
      "Say what you ate and Clover figures out the rest. No tapping through menus — just speak naturally and move on with your day.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Sparkles,
    title: "Smart Nutrition Extraction",
    description:
      "Clover uses structured AI analysis grounded in USDA data to extract calories, protein, carbs, fat, and fiber from any description.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: BarChart3,
    title: "Live Macro Dashboard",
    description:
      "Watch your daily macros fill up in real time. Color-coded progress bars and a 7-day trend chart keep you on track without obsessing.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: CalendarDays,
    title: "Calendar History",
    description:
      "Tap any day on the monthly calendar to see exactly what you ate and how your macros stacked up. Patterns become obvious at a glance.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: ChefHat,
    title: "Recipe Recommendations",
    description:
      "Get recipe ideas filtered by your dietary preferences and allergens — powered by a database of millions of real recipes.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: MessageSquare,
    title: "AI Health Chat",
    description:
      "Ask questions about your food history and get personalised answers. \"How much protein did I average this week?\" — just ask.",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: Smartphone,
    title: "Works on Any Device",
    description:
      "Fully responsive on mobile, tablet, and desktop. Log from your phone at a restaurant or review your week on a laptop — it all syncs instantly.",
    color: "bg-slate-50 text-slate-600",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try Clover with no commitment.",
    highlight: false,
    badge: null,
    features: [
      "10 AI voice logs per month",
      "Basic macro dashboard",
      "7-day history",
      "Manual text entry",
    ],
    cta: "Get started free",
    ctaVariant: "outline" as const,
  },
  {
    name: "Clover Plus",
    price: "$7.99",
    period: "per month",
    yearlyNote: "or $59/year — save 38%",
    description: "For anyone serious about their nutrition.",
    highlight: true,
    badge: "Most popular",
    features: [
      "Unlimited AI voice logs",
      "Full macro history",
      "Calendar view",
      "AI health overview & tips",
      "Recipe recommendations",
      "Data-aware AI chat",
      "Edit & delete log entries",
    ],
    cta: "Start Plus",
    ctaVariant: "default" as const,
  },
  {
    name: "Clover Pro",
    price: "$14.99",
    period: "per month",
    yearlyNote: "or $99/year — save 45%",
    description: "For athletes and nutrition-focused users.",
    highlight: false,
    badge: null,
    features: [
      "Everything in Plus",
      "Travel meal sourcing",
      "Weekly email digest",
      "Priority AI response",
      "Export to CSV",
      "Allergen alert banners",
    ],
    cta: "Start Pro",
    ctaVariant: "outline" as const,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I've tried every food tracker out there. Clover is the first one I've actually stuck with — talking is so much faster than tapping.",
    name: "Alex R.",
    role: "Marathon runner",
    stars: 5,
  },
  {
    quote:
      "The AI actually understands context. I said 'I had a big bowl of my mom's pasta' and it asked the right follow-up questions.",
    name: "Jamie L.",
    role: "Nutritionist",
    stars: 5,
  },
  {
    quote:
      "Finally a wellness app that doesn't make me feel guilty. The calendar view helped me spot that I always under-eat on Mondays.",
    name: "Sam K.",
    role: "Hobbyist cyclist",
    stars: 5,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NavBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 font-semibold text-lg text-foreground">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span>Clover Wellness</span>
        </a>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <a href={getLoginUrl()} className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </a>
          <Button size="sm" asChild>
            <a href={getLoginUrl()}>
              Get started free
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white pt-20 pb-24 sm:pt-28 sm:pb-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-violet-100/30 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1 text-xs font-medium">
          <Zap className="w-3 h-3" />
          Voice-activated nutrition tracking
        </Badge>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight max-w-3xl mx-auto">
          Log what you eat by{" "}
          <span className="text-blue-600">just saying it</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Clover listens to how you naturally describe your meals, extracts
          accurate nutrition data, and builds a clear picture of your health —
          without the friction of traditional food trackers.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8 h-12 relative overflow-hidden group" asChild>
            <a href={getLoginUrl()}>
              {/* Subtle shimmer sweep on the primary CTA */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              Start for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
            </a>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12 bg-white" asChild>
            <a href="#pricing">See pricing</a>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required &nbsp;·&nbsp; 10 free AI logs per month &nbsp;·&nbsp; Cancel anytime
        </p>

        {/* App preview mockup */}
        <div className="mt-16 relative max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border/60 bg-white shadow-2xl shadow-blue-100/50 overflow-hidden">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-border/40">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 mx-4 h-5 rounded-full bg-gray-200/80 text-xs flex items-center px-3 text-gray-400">
                cloverfarm-hu9ucpss.manus.space
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">Good morning</p>
                  <h3 className="font-semibold text-foreground">Today's Overview</h3>
                </div>
                <Badge variant="secondary" className="text-xs">Tuesday, Jun 24</Badge>
              </div>

              {/* Macro cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Calories", value: "1,420", goal: "2,000", pct: 71, color: "bg-blue-500" },
                  { label: "Protein", value: "68g", goal: "120g", pct: 57, color: "bg-violet-500" },
                  { label: "Carbs", value: "142g", goal: "250g", pct: 57, color: "bg-amber-500" },
                  { label: "Fiber", value: "18g", goal: "25g", pct: 72, color: "bg-emerald-500" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-border/50 p-3 bg-gray-50/50">
                    <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                    <p className="font-semibold text-sm text-foreground">{m.value}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">of {m.goal}</p>
                  </div>
                ))}
              </div>

              {/* Log entries */}
              <div className="space-y-2">
                {[
                  { name: "Greek Yogurt with Berries", cal: 180, time: "8:12 AM", conf: "high" },
                  { name: "Chicken & Avocado Salad", cal: 520, time: "12:45 PM", conf: "high" },
                  { name: "Handful of almonds", cal: 170, time: "3:30 PM", conf: "medium" },
                ].map((log) => (
                  <div key={log.name} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2.5 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                        <Leaf className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{log.name}</p>
                        <p className="text-xs text-muted-foreground">{log.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{log.cal} kcal</p>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${log.conf === "high" ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"}`}
                      >
                        {log.conf}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Voice input bar */}
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-muted-foreground italic flex-1">
                  "I just had a bowl of oatmeal with banana and honey…"
                </p>
                <div className="flex gap-1">
                  {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
                    <div key={i} className="w-1 rounded-full bg-blue-400 animate-pulse" style={{ height: `${h * 3}px`, animationDelay: `${i * 80}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -right-4 sm:-right-6 bg-white rounded-xl border border-border shadow-lg px-4 py-2.5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Logged in 4 seconds</p>
              <p className="text-xs text-muted-foreground">vs. 45 sec manually</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Everything you need, nothing you don't
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Clover is designed around one principle: logging your food should take less time than eating it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-border/50 hover:border-blue-200 hover:shadow-md transition-all duration-200 group">
              <CardHeader className="pb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color} mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-gray-50/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Start free. Upgrade when you're ready. No hidden fees, no annual lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border bg-white p-8 flex flex-col gap-6 transition-all duration-200 ${
                plan.highlight
                  ? "border-blue-500 shadow-xl shadow-blue-100/60 ring-1 ring-blue-500/20 scale-[1.02]"
                  : "border-border/60 hover:border-blue-200 hover:shadow-md"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white hover:bg-blue-600 px-3 py-0.5 text-xs">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-foreground text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/{plan.period}</span>
                </div>
                {plan.yearlyNote && (
                  <p className="text-xs text-muted-foreground mt-1">{plan.yearlyNote}</p>
                )}
              </div>

              <ul className="space-y-3 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.ctaVariant}
                className={`w-full h-11 ${plan.highlight ? "" : "bg-white"}`}
                asChild
              >
                <a href={getLoginUrl()}>
                  {plan.cta}
                  {plan.highlight && <ArrowRight className="w-4 h-4 ml-1.5" />}
                </a>
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          All plans include a 14-day free trial of Plus features. &nbsp;·&nbsp; Prices in USD. &nbsp;·&nbsp; Cancel anytime.
        </p>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Reviews</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            People who actually use it
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="py-12 bg-gray-50/60 border-y border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { icon: Shield, label: "Privacy first", desc: "Your food data is private and never sold" },
            { icon: Zap, label: "Instant results", desc: "AI nutrition extraction in under 3 seconds" },
            { icon: Smartphone, label: "Works everywhere", desc: "Mobile-optimised for on-the-go logging" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-blue-600" />
              </div>
              <p className="font-semibold text-foreground text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Ready to understand what you eat?
        </h2>
        <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto">
          Join Clover Wellness today. Start free, no credit card required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 text-base px-8 h-12 text-blue-700 font-semibold" asChild>
            <a href={getLoginUrl()}>
              Get started for free
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-border/40 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            Clover Wellness
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
            <a href={getLoginUrl()} className="hover:text-foreground transition-colors">Sign in</a>
          </nav>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Clover Wellness. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <NavBar />
      <HeroSection />
      <TrustBar />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CtaBanner />
      <Footer />
    </div>
  );
}
