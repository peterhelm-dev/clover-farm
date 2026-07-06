import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone, Mic, Brain, Droplet, Calendar, Apple, Zap, Lock,
  ArrowRight, CheckCircle2, Image as ImageIcon, Leaf
} from "lucide-react";
import { useLocation } from "wouter";

export default function FeaturesPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: ImageIcon,
      title: "Photo-Based Meal Logging",
      description: "Snap a photo of your meal and let AI instantly analyze it. No manual entry needed — just point and log.",
      details: ["AI vision analysis", "Automatic macro extraction", "Crop & rotate controls", "Image compression for fast uploads"]
    },
    {
      icon: Mic,
      title: "Voice-First Logging",
      description: "Simply say what you ate. Clover listens, understands, and logs your meals with natural language processing.",
      details: ["Real-time transcription", "AI clarifying questions", "Macro auto-calculation", "Multi-language support"]
    },
    {
      icon: Droplet,
      title: "Water Intake Tracking",
      description: "Stay hydrated with daily water goals. Quick-log buttons (250ml, 500ml, 1L) make tracking effortless.",
      details: ["Visual progress circle", "Daily goal setting", "Quick-log presets", "Hydration reminders"]
    },
    {
      icon: Calendar,
      title: "AI Meal Planning",
      description: "Get personalized weekly meal suggestions powered by AI. Save favorites and regenerate anytime.",
      details: ["AI-generated suggestions", "Personalized to your diet", "Weekly meal views", "Save & regenerate options"]
    },
    {
      icon: Brain,
      title: "AI Health Insights",
      description: "Real-time AI analysis of your nutrition patterns, health trends, and personalized recommendations.",
      details: ["Macro balance analysis", "Health trend detection", "Personalized tips", "Weekly summaries"]
    },
    {
      icon: Apple,
      title: "Recipes & Nutrition",
      description: "Browse thousands of recipes with complete nutrition data. Filter by diet, allergies, and preferences.",
      details: ["Edamam API integration", "Nutrition breakdown", "Allergy filtering", "Save favorites"]
    },
    {
      icon: Zap,
      title: "Instant Macro Tracking",
      description: "See your daily macros at a glance with beautiful charts and real-time updates.",
      details: ["Visual macro charts", "Daily progress", "Goal tracking", "Macro breakdowns"]
    },
    {
      icon: Lock,
      title: "Privacy First",
      description: "Your data stays yours. End-to-end encrypted, no tracking, no ads. Complete privacy control.",
      details: ["Encrypted storage", "No data selling", "GDPR compliant", "Export anytime"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-green-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" />
            <span className="text-xl font-bold text-gray-900">Clover Wellness</span>
          </div>
          <button
            onClick={() => setLocation("/")}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Back to Home
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200">
            Powerful Features
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to Track Your Wellness
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            From photo-based meal logging to AI-powered insights, Clover makes nutrition tracking effortless and natural.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="border border-green-100 hover:border-green-300 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <Icon className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <CardTitle className="text-xl mt-4">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-green-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Wellness?</h2>
          <p className="text-lg mb-8 text-green-100">
            Start tracking your meals naturally. No credit card required.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-white text-green-600 hover:bg-green-50 font-semibold px-8 py-3 text-lg"
          >
            Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p>&copy; 2026 Clover Wellness. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
