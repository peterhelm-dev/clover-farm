import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sprout, ChefHat, ShoppingBag, Calendar, MessageSquare, Target, CheckCircle2 } from "lucide-react";

export default function HowItWorks() {
  const { loginAs } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container max-w-5xl">
          {/* Header section */}
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif text-foreground">
              How Clover Farm Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We coordinate local food supply and demand before checkout. Discover how our 3-sided network creates a predictable regional food system.
            </p>
          </div>

          {/* Core coordination pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <Card className="relative overflow-hidden border-border/60 hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <CardContent className="pt-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Sprout className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-serif">1. Growers List Harvests</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Farms publish what they expect to harvest, including quantities, timing, and available pickup windows. No complex checkout setup required.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/60 hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-destructive" />
              <CardContent className="pt-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                  <ChefHat className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-serif">2. Buyers Post Requests</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Restaurants and consumers share what they need for their upcoming weekly menus or meal plans, giving growers immediate demand visibility.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/60 hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-foreground" />
              <CardContent className="pt-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent-foreground">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-serif">3. System Matches Overlaps</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our matching engine finds overlaps in item types, quantities, location, and timing. It notifies both sides to coordinate fulfillment directly.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Role Guides */}
          <div className="space-y-16">
            <div className="border-t border-border/40 pt-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <Sprout className="h-3.5 w-3.5" /> For Local Growers
                  </div>
                  <h2 className="text-3xl font-bold font-serif leading-tight">
                    Secure demand before you harvest
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Avoid wasting precious hours sitting at empty market stalls or selling at low wholesale margins. Clover Farm lets you post expected yields, find immediate buyers, and coordinate structured pickups.
                  </p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Create flexible listings on your phone from the field
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Track aggregate local demand trends in Concord
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Coordinate custom pickup windows at your farm stand or hubs
                    </li>
                  </ul>
                  <Link href="/dashboard">
                    <Button onClick={() => loginAs("grower")} className="gap-2">
                      Simulate Grower Dashboard
                    </Button>
                  </Link>
                </div>
                <div className="bg-muted/40 rounded-2xl p-6 border border-border/40">
                  <img 
                    src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80" 
                    alt="Grower harvesting" 
                    className="rounded-xl shadow-sm object-cover w-full h-64"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 pt-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
                <div className="bg-muted/40 rounded-2xl p-6 border border-border/40 md:order-last">
                  <img 
                    src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80" 
                    alt="Chef cooking" 
                    className="rounded-xl shadow-sm object-cover w-full h-64"
                  />
                </div>
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                    <ChefHat className="h-3.5 w-3.5" /> For Chefs & Restaurants
                  </div>
                  <h2 className="text-3xl font-bold font-serif leading-tight">
                    Reliable local sourcing without the chaos
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Stop sending dozens of frantic text messages to different farmers on Sunday night. Post your sourcing requests on Clover Farm, review compatible listings, and lock in your ingredients for next week's specials.
                  </p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-destructive" /> Post single or recurring ingredient requests
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-destructive" /> See exact growing methods and certifications
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-destructive" /> Chat directly with farmers to coordinate logistics
                    </li>
                  </ul>
                  <Link href="/dashboard">
                    <Button onClick={() => loginAs("restaurant")} variant="destructive" className="gap-2">
                      Simulate Restaurant Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 pt-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-semibold">
                    <ShoppingBag className="h-3.5 w-3.5" /> For Households
                  </div>
                  <h2 className="text-3xl font-bold font-serif leading-tight">
                    Eat fresher meals and support Concord farms
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Connect directly with the people growing your food. Browse what is currently in season, coordinate convenient pickups, and let our AI helper design delicious weekly meals around available Concord harvests.
                  </p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent-foreground" /> Access the absolute freshest regional ingredients
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent-foreground" /> Plan meals based on real-time harvest schedules
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent-foreground" /> Build meaningful relationships with Concord growers
                    </li>
                  </ul>
                  <Link href="/dashboard">
                    <Button onClick={() => loginAs("consumer")} variant="outline" className="gap-2 border-accent-foreground/30 hover:bg-accent/10">
                      Simulate Household Dashboard
                    </Button>
                  </Link>
                </div>
                <div className="bg-muted/40 rounded-2xl p-6 border border-border/40">
                  <img 
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80" 
                    alt="Fresh vegetables in market" 
                    className="rounded-xl shadow-sm object-cover w-full h-64"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
