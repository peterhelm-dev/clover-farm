import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, HelpCircle, RefreshCw, Sprout, ChefHat, ShoppingBag } from "lucide-react";

export default function AIPlanner() {
  const { generateWeeklyPlan } = useApp();
  const [activeTab, setActiveTab] = useState<"consumer" | "restaurant" | "grower">("consumer");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(generateWeeklyPlan("consumer", []));

  const handleGenerate = (role: "consumer" | "restaurant" | "grower") => {
    setLoading(true);
    setTimeout(() => {
      setPlan(generateWeeklyPlan(role, []));
      setLoading(false);
    }, 800);
  };

  const handleTabChange = (tab: "consumer" | "restaurant" | "grower") => {
    setActiveTab(tab);
    handleGenerate(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> AI Assistive Sourcing
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif text-foreground">
              Clover AI Planner
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We don't invent food. Our planner helps you build menus, weekly meal schedules, or crop listings based on actual Concord farm availability and active local demand.
            </p>
          </div>

          {/* Interactive Simulator */}
          <Card className="border-border/60 overflow-hidden shadow-sm mb-16">
            <div className="bg-primary/5 px-6 py-4 border-b border-border/40 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={activeTab === "consumer" ? "default" : "ghost"}
                  onClick={() => handleTabChange("consumer")}
                  className="gap-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Household Plan
                </Button>
                <Button 
                  size="sm" 
                  variant={activeTab === "restaurant" ? "default" : "ghost"}
                  onClick={() => handleTabChange("restaurant")}
                  className="gap-2"
                >
                  <ChefHat className="h-4 w-4" />
                  Restaurant Sourcing
                </Button>
                <Button 
                  size="sm" 
                  variant={activeTab === "grower" ? "default" : "ghost"}
                  onClick={() => handleTabChange("grower")}
                  className="gap-2"
                >
                  <Sprout className="h-4 w-4" />
                  Grower Crop Insights
                </Button>
              </div>

              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleGenerate(activeTab)}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            </div>

            <CardContent className="p-6">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Evaluating active Concord listings and demand clusters...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <h3 className="font-serif text-xl font-bold text-foreground">{plan.title}</h3>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1">
                      <Sparkles className="h-3 w-3" /> Traceable Sourcing
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    {plan.suggestions.map((item: any, idx: number) => (
                      <div key={idx} className="group relative bg-muted/20 hover:bg-muted/40 p-5 rounded-xl border border-border/30 transition-all duration-300">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                              <span className="text-primary text-xs font-mono bg-primary/10 px-2 py-0.5 rounded">
                                Suggestion {idx + 1}
                              </span>
                              {item.label}
                            </h4>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.explanation}
                          </p>

                          {item.linkedListingIds.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-primary font-medium">
                              <Sprout className="h-3.5 w-3.5" />
                              <span>Linked to active local harvest listings</span>
                            </div>
                          )}

                          {item.substitutions.length > 0 && (
                            <div className="pt-2 border-t border-border/20 flex flex-wrap gap-2 items-center">
                              <span className="text-xs text-muted-foreground">Local Substitutions:</span>
                              {item.substitutions.map((sub: string, sIdx: number) => (
                                <Badge key={sIdx} variant="secondary" className="text-[11px] font-normal">
                                  {sub}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/20 flex items-start gap-3 text-xs text-accent-foreground leading-relaxed">
                    <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Why this works:</span> Every recommendation above is grounded in real Concord farm capacity. If an item becomes unavailable, the system automatically suggests regional substitutions or prompts you to create a sourcing request so growers can see the demand.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Theoretical transparency block */}
          <div className="bg-muted/30 rounded-2xl p-8 border border-border/40 space-y-4">
            <h3 className="text-xl font-bold font-serif text-center">Our Transparency Mandate</h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto">
              We do not believe in AI hallucinations when it comes to what you put on your plate or serve in your restaurant. The Clover AI Planner is built strictly on top of verified grower capacity, seasonal timelines, and active requests. It is an administrative assistant, not a creative chef.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
