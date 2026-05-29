import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sprout, ChefHat, ShoppingBag, ArrowRight, Sparkles, Calendar, 
  MapPin, CheckCircle2, Star, Users, Leaf, ArrowUpRight 
} from "lucide-react";

export default function Home() {
  const { currentRole, loginAs } = useApp();

  const activePilotGrowers = [
    { name: "Maple Hill Farm", specialty: "Organic Heirloom Greens & Eggs", loc: "East Concord, NH" },
    { name: "Clover Ridge Orchards", specialty: "Tree Fruits, Berries & Honey", loc: "Penacook, NH" },
    { name: "Brookside Root & Forage", specialty: "Specialty Mushrooms & Herbs", loc: "Bow, NH" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Soft textured background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10" />
        
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Overhauling Concord's Local Food System
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-serif text-foreground leading-[1.1]">
              The <span className="text-primary italic">Coordination Layer</span> for Local Food Sourcing
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Clover Farm connects local growers, chefs, and meal planners in Concord, NH. By aligning harvest predictions with sourcing requests early in the weekly cycle, we remove transactional friction and food waste.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/features">
                <Button size="lg" className="gap-2">
                  See How It Works <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="gap-2">
                  Enter Simulated App <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Simulated Session Fast-Track */}
            <div className="pt-6 border-t border-border/40">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Quick-select simulated user session:
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => loginAs("grower")}
                  className="gap-1.5 border border-border/50 bg-card/50 text-xs"
                >
                  <Sprout className="h-3.5 w-3.5 text-primary" /> Silas (Grower)
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => loginAs("restaurant")}
                  className="gap-1.5 border border-border/50 bg-card/50 text-xs"
                >
                  <ChefHat className="h-3.5 w-3.5 text-destructive" /> Chef Thomas (Restaurant)
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => loginAs("consumer")}
                  className="gap-1.5 border border-border/50 bg-card/50 text-xs"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-accent-foreground" /> Jane (Household)
                </Button>
              </div>
            </div>
          </div>

          {/* Hero Media (Custom Generated Image) */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/40 shadow-xl bg-muted">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663588202014/hU9uCPSS7HGW4CDwXkxoga/clover-hero-BgCLr8Q8uBiT7tfpsKkAUg.webp" 
                alt="Concord Local Farm to Table Scene" 
                className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
            
            {/* Overlay Badges */}
            <div className="absolute -bottom-6 -left-6 bg-card border border-border/40 p-4 rounded-xl shadow-lg max-w-[200px] animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Star className="h-4 w-4 fill-primary" /> 100% Traceable
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Every harvest is linked to a verified Concord farm profile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot Program Banner */}
      <section className="bg-primary/5 border-y border-primary/10 py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-primary">Now Launching: Concord NH Regional Pilot</h3>
            <p className="text-xs text-muted-foreground">We are establishing localized density to guarantee predictable food matches.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="font-bold font-serif text-xl text-foreground">3</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Farms Seeding</div>
            </div>
            <div className="text-center">
              <div className="font-bold font-serif text-xl text-foreground">2</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Kitchens Active</div>
            </div>
            <div className="text-center">
              <div className="font-bold font-serif text-xl text-foreground">88%</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Match Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-muted/20">
        <div className="container max-w-5xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-serif text-foreground">
              Coordination Over Checkout
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              We believe regional food systems struggle because they try to replicate supermarket checkout. Clover Farm focus on early weekly planning instead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-6 bg-card rounded-xl border border-border/40 hover:shadow-sm transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Leaf className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Predictive Yields</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Growers list predicted harvest quantities days before cutting, giving local buyers immediate visibility.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-card rounded-xl border border-border/40 hover:shadow-sm transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                <ChefHat className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Direct Matching</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our matching engine automatically highlights overlaps in ingredient types, quantities, and timing.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-card rounded-xl border border-border/40 hover:shadow-sm transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent-foreground">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Structured Pickups</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Farms define custom pickup windows at farm stands or downtown hubs, streamlining regional logistics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pilot Farms */}
      <section className="py-20">
        <div className="container max-w-5xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-serif text-foreground">
              Meet Our Concord Pilot Farms
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Supporting regional agriculture means knowing the hands that tend the soil. Meet our launch partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activePilotGrowers.map((farm, idx) => (
              <Card key={idx} className="border-border/60 overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="h-48 bg-muted relative">
                  <img 
                    src={
                      idx === 0 ? "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80" :
                      idx === 1 ? "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=80" :
                      "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80"
                    } 
                    alt={farm.name} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <CardContent className="p-5 space-y-3">
                  <Badge variant="secondary" className="text-[10px]">{farm.loc}</Badge>
                  <h3 className="font-serif text-lg font-bold text-foreground">{farm.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{farm.specialty}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary-foreground/5 -z-10" />
        <div className="container max-w-4xl text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold font-serif">Ready to overhaul local food sourcing?</h2>
          <p className="text-sm text-primary-foreground/80 max-w-xl mx-auto leading-relaxed">
            Join the Concord pilot. Whether you are a commercial grower, a busy chef, or a seasonal meal planner, Clover Farm has a simulated session ready for you to explore.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="gap-2">
                Open Simulated App <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
