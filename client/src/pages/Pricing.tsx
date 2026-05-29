import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, HelpCircle, Sparkles } from "lucide-react";

export default function Pricing() {
  const { loginAs } = useApp();

  const plans = [
    {
      name: "Pilot Consumer",
      price: "$0",
      period: "forever during pilot",
      desc: "For Concord households wanting to coordinate fresh weekly meals and support local farms.",
      features: [
        "Browse local grower listings",
        "Create weekly sourcing requests",
        "Coordinate pickup windows",
        "Access AI Weekly Meal Planner",
        "Save preferred local farms"
      ],
      cta: "Join as Household",
      role: "consumer" as const,
      variant: "outline" as const
    },
    {
      name: "Grower Starter",
      price: "$19",
      period: "per month",
      desc: "For small-scale market gardens and hobby farms seeking local demand visibility.",
      features: [
        "Farm profile on Clover directory",
        "Up to 5 active harvest listings",
        "Define custom pickup windows",
        "Inbound request notifications",
        "Direct chat with local buyers",
        "Includes 10 matched connections/mo"
      ],
      cta: "Start Farm Trial",
      role: "grower" as const,
      variant: "default" as const,
      popular: true
    },
    {
      name: "Restaurant Sourcing",
      price: "$49",
      period: "per month",
      desc: "For professional kitchens, chefs, and food buyers looking to streamline local sourcing.",
      features: [
        "Restaurant profile",
        "Unlimited sourcing requests",
        "Direct matching with local yields",
        "AI Sourcing & Menu Assistant",
        "Priority message threads",
        "Includes 25 matched connections/mo"
      ],
      cta: "Start Kitchen Trial",
      role: "restaurant" as const,
      variant: "default" as const
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif text-foreground">
              Transparent, Value-First Pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We align our monetization with your success. Start coordinating for free during our Concord pilot, and scale as your connections grow.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {plans.map((p, idx) => (
              <Card 
                key={idx} 
                className={`relative flex flex-col justify-between border-border/60 overflow-hidden hover:shadow-md transition-all duration-300 ${
                  p.popular ? "border-primary ring-1 ring-primary" : ""
                }`}
              >
                {p.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                    Popular
                  </div>
                )}
                
                <CardHeader className="pt-6">
                  <CardTitle className="font-serif text-xl font-bold">{p.name}</CardTitle>
                  <CardDescription className="min-h-[40px] text-xs mt-1">{p.desc}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold tracking-tight text-foreground">{p.price}</span>
                    <span className="text-xs text-muted-foreground ml-1">/{p.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      What's Included:
                    </div>
                    <ul className="space-y-2.5">
                      {p.features.map((f, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-xs text-muted-foreground leading-normal">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="pb-6">
                  <Button 
                    className="w-full" 
                    variant={p.variant}
                    onClick={() => loginAs(p.role)}
                  >
                    {p.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Monetization note */}
          <div className="bg-muted/40 rounded-2xl p-8 border border-border/40 space-y-4">
            <h3 className="text-xl font-bold font-serif text-center">Match Monetization (Phase 2 Strategy)</h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto">
              Our core philosophy is that we only charge when we deliver value. Each plan includes a generous quota of monthly <strong>matched connections</strong>. Once you exceed your quota, we charge a nominal fee per successful sourcing connection. No transaction commission or payment setup is required during our Phase 1 coordination pilot.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
