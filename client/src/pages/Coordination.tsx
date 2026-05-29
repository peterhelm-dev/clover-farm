import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, UserCheck, Tag, FileQuestion, CalendarRange, ArrowRightLeft } from "lucide-react";

export default function Coordination() {
  const pillars = [
    {
      title: "1. Role Profiles",
      icon: UserCheck,
      desc: "Every grower, restaurant, and consumer establishes a verified profile outlining their capacity, growing practices, typical sourcing needs, or planning goals.",
      color: "text-primary bg-primary/10"
    },
    {
      title: "2. Harvest Listings",
      icon: Tag,
      desc: "Growers post anticipated harvest items, quantities, and price points. Listings are flexible and updated easily from mobile fields.",
      color: "text-emerald-600 bg-emerald-500/10"
    },
    {
      title: "3. Sourcing Requests",
      icon: FileQuestion,
      desc: "Buyers post specific weekly ingredient needs, quantity thresholds, and required dates, creating immediate demand visibility.",
      color: "text-destructive bg-destructive/10"
    },
    {
      title: "4. Pickup Windows",
      icon: CalendarRange,
      desc: "Growers outline specific times and physical locations (farm stands, community hubs) where coordinated items can be picked up safely.",
      color: "text-accent-foreground bg-accent/20"
    },
    {
      title: "5. Overlap Matches",
      icon: ArrowRightLeft,
      desc: "The platform's matching engine evaluates overlaps in categories, quantities, timing, and proximity to suggest direct connections.",
      color: "text-blue-600 bg-blue-500/10"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-2">
              <Leaf className="h-6 w-6 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif text-foreground">
              The Coordination Layer
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Why do local food systems struggle online? It's not a lack of interest—it's the friction of coordination. We solve who has what, who needs what, and how pickup happens before introducing complex checkout.
            </p>
          </div>

          {/* Theoretical breakdown */}
          <div className="space-y-8 mb-20">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold font-serif mb-4">Coordination-First vs. Checkout-First</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Most e-commerce systems require absolute inventory guarantees and instant digital payments. But small farms deal with changing weather, pest variations, and shifting harvest yields. Forcing them into rigid checkout systems often leads to broken orders, frustrated chefs, and administrative headaches.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Clover Farm introduces a <strong>coordination layer</strong>. By letting growers and buyers communicate expectations and match compatibility early in the weekly cycle, we build trust and clear logistics pathways. Transactions become a natural final step, not a stressful barrier to entry.
              </p>
            </div>
          </div>

          {/* Interactive Object Cards */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-serif mb-6 text-center">Core Platform Objects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pillars.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <Card key={idx} className="border-border/60 hover:border-primary/40 transition-colors duration-300">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${p.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="font-serif text-lg">{p.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Strategy section */}
          <div className="mt-20 bg-muted/40 rounded-2xl p-8 border border-border/40 text-center space-y-4">
            <h3 className="text-xl font-bold font-serif">Concord Pilot Focus</h3>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              We are launching exclusively in Concord, NH to establish localized density. By seeding supply first with 10–20 premium growers, we ensure that local restaurants and meal planners always find relevant, fresh matches.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
