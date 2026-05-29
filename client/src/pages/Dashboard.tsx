import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sprout, ChefHat, ShoppingBag, Plus, Calendar, MapPin, MessageSquare, 
  Sparkles, Check, CheckCircle2, ArrowUpRight, ArrowRight, UserCheck, Tag, FileQuestion
} from "lucide-react";
import { CardFooter } from "@/components/ui/card";

export default function Dashboard() {
  const { 
    currentRole, currentUser, farms, pickupWindows, listings, requests, matches, messages,
    addListing, addRequest, addPickupWindow, acceptMatch, sendMessage, generateWeeklyPlan 
  } = useApp();

  // Active sub-navigation tab
  const [activeTab, setActiveTab] = useState("overview");

  // Form states
  const [listName, setListName] = useState("");
  const [listCategory, setListCategory] = useState("Vegetables");
  const [listQty, setListQty] = useState("");
  const [listUnit, setListUnit] = useState("lbs");
  const [listPrice, setListPrice] = useState("");
  const [listWindow, setListWindow] = useState("");

  const [reqName, setReqName] = useState("");
  const [reqCategory, setReqCategory] = useState("Vegetables");
  const [reqQty, setReqQty] = useState("");
  const [reqUnit, setReqUnit] = useState("lbs");
  const [reqFlex, setReqFlex] = useState<"strict" | "flexible" | "highly_flexible">("flexible");
  const [reqDate, setReqByDate] = useState("2026-06-04");

  const [windowLabel, setWindowLabel] = useState("");
  const [windowAddress, setWindowAddress] = useState("");
  const [windowDay, setWindowDay] = useState("Thursday");
  const [windowStart, setWindowStarts] = useState("15:00");
  const [windowEnd, setWindowEnds] = useState("18:00");
  const [windowInstructions, setWindowInstructions] = useState("");

  // Messaging active thread state
  const [activeMatchId, setActiveMatchId] = useState<string | null>(matches[0]?.id || null);
  const [replyText, setReplyText] = useState("");

  // AI Plan preferences state
  const [aiPrefs, setAiPrefs] = useState<string[]>([]);
  const [aiPlan, setAiPlan] = useState<any>(generateWeeklyPlan(currentRole, []));

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName || !listQty) return;
    
    addListing({
      itemName: listName,
      category: listCategory,
      quantity: parseFloat(listQty),
      unit: listUnit,
      price: listPrice ? parseFloat(listPrice) : undefined,
      availabilityStart: "2026-06-01",
      availabilityEnd: "2026-06-08",
      pickupWindowId: listWindow || "window-1"
    });

    // Reset form
    setListName("");
    setListQty("");
    setListPrice("");
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName || !reqQty) return;

    addRequest({
      itemName: reqName,
      category: reqCategory,
      quantity: parseFloat(reqQty),
      unit: reqUnit,
      neededBy: reqDate,
      flexibility: reqFlex
    });

    // Reset form
    setReqName("");
    setReqQty("");
  };

  const handleCreatePickupWindow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!windowLabel || !windowAddress) return;

    addPickupWindow({
      locationLabel: windowLabel,
      address: windowAddress,
      dayOfWeek: windowDay,
      startsAt: windowStart,
      endsAt: windowEnd,
      instructions: windowInstructions
    });

    // Reset form
    setWindowLabel("");
    setWindowAddress("");
    setWindowInstructions("");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatchId || !replyText.trim()) return;

    sendMessage(activeMatchId, replyText);
    setReplyText("");
  };

  // Generate AI Plan
  const handleGenerateAiPlan = () => {
    setAiPlan(generateWeeklyPlan(currentRole, aiPrefs));
  };

  // If user is a guest, prompt them to select a role
  if (currentRole === "guest") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="container max-w-md text-center space-y-6">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold font-serif">Simulate Dashboard</h1>
            <p className="text-muted-foreground">
              To view the interactive dashboards, please select one of our pre-configured role sessions using the switcher in the navigation header.
            </p>
            <div className="p-4 bg-muted/40 rounded-xl border border-border/40 text-left space-y-3">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wider text-center">Available Sessions:</div>
              <button 
                onClick={() => {}} 
                className="w-full text-left p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors flex items-center gap-3"
              >
                <Sprout className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-sm">Silas Bartlett (Grower)</div>
                  <div className="text-[11px] text-muted-foreground">Maple Hill Farm. Post listings & coordinate pickups.</div>
                </div>
              </button>
              <button 
                onClick={() => {}} 
                className="w-full text-left p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors flex items-center gap-3"
              >
                <ChefHat className="h-5 w-5 text-destructive" />
                <div>
                  <div className="font-semibold text-sm">Chef Thomas (Restaurant)</div>
                  <div className="text-[11px] text-muted-foreground">The Concord Table. Post sourcing requests & find matches.</div>
                </div>
              </button>
              <button 
                onClick={() => {}} 
                className="w-full text-left p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors flex items-center gap-3"
              >
                <ShoppingBag className="h-5 w-5 text-accent-foreground" />
                <div>
                  <div className="font-semibold text-sm">Jane Miller (Household)</div>
                  <div className="text-[11px] text-muted-foreground">Local Consumer. Weekly meal planner & farm finder.</div>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              Use the top-right header badge to swap roles dynamically at any time.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Active messages filter
  const activeMessages = messages.filter(m => m.matchId === activeMatchId);
  const activeMatch = matches.find(m => m.id === activeMatchId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8 md:py-12">
        <div className="container">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  Concord Pilot Active
                </Badge>
                <span className="text-xs text-muted-foreground">Session ID: {currentUser?.id}</span>
              </div>
              <h1 className="text-3xl font-bold font-serif mt-1 text-foreground">
                Welcome back, {currentUser?.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {currentRole === "grower" && "Maple Hill Farm Dashboard • East Concord, NH"}
                {currentRole === "restaurant" && "The Concord Table Dashboard • Concord Downtown"}
                {currentRole === "consumer" && "Household Sourcing & Planning Dashboard"}
              </p>
            </div>

            {/* Dashboard Sub-Tabs switcher */}
            <div className="flex bg-muted/40 p-1 rounded-lg border border-border/40">
              <Button 
                size="sm" 
                variant={activeTab === "overview" ? "default" : "ghost"}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </Button>
              <Button 
                size="sm" 
                variant={activeTab === "coordination" ? "default" : "ghost"}
                onClick={() => setActiveTab("coordination")}
              >
                {currentRole === "grower" ? "My Listings" : "Sourcing Requests"}
              </Button>
              <Button 
                size="sm" 
                variant={activeTab === "matches" ? "default" : "ghost"}
                onClick={() => setActiveTab("matches")}
                className="relative"
              >
                Matches
                {matches.filter(m => m.status === "open").length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </Button>
              <Button 
                size="sm" 
                variant={activeTab === "ai-planner" ? "default" : "ghost"}
                onClick={() => {
                  setActiveTab("ai-planner");
                  handleGenerateAiPlan();
                }}
              >
                AI Planner
              </Button>
            </div>
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-border/60">
                    <CardContent className="pt-6">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {currentRole === "grower" ? "Active Listings" : "Open Requests"}
                      </div>
                      <div className="text-3xl font-bold font-serif text-foreground mt-1">
                        {currentRole === "grower" 
                          ? listings.filter(l => l.status === "open").length 
                          : requests.filter(r => r.status === "open").length
                        }
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardContent className="pt-6">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Total Matches
                      </div>
                      <div className="text-3xl font-bold font-serif text-foreground mt-1">
                        {matches.length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardContent className="pt-6">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Match Rate
                      </div>
                      <div className="text-3xl font-bold font-serif text-foreground mt-1">
                        88%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Primary Action Panel */}
                {currentRole === "grower" && (
                  <Card className="border-border/60">
                    <CardHeader>
                      <CardTitle className="font-serif text-xl">Publish Fresh Harvest</CardTitle>
                      <CardDescription className="text-xs">Post what you expect to yield this week so Concord buyers can coordinate.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateListing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground">Harvest Item Name</label>
                          <Input 
                            placeholder="e.g. Heirloom Cherry Tomatoes" 
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground">Category</label>
                          <Select value={listCategory} onValueChange={setListCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Vegetables">Vegetables</SelectItem>
                              <SelectItem value="Greens">Greens</SelectItem>
                              <SelectItem value="Fruit">Fruit</SelectItem>
                              <SelectItem value="Eggs">Eggs</SelectItem>
                              <SelectItem value="Honey">Honey</SelectItem>
                              <SelectItem value="Mushrooms">Mushrooms</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground">Quantity</label>
                            <Input 
                              type="number" 
                              placeholder="e.g. 25" 
                              value={listQty}
                              onChange={(e) => setListQty(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground">Unit</label>
                            <Select value={listUnit} onValueChange={setListUnit}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lbs">lbs</SelectItem>
                                <SelectItem value="bunches">bunches</SelectItem>
                                <SelectItem value="quarts">quarts</SelectItem>
                                <SelectItem value="dozens">dozens</SelectItem>
                                <SelectItem value="pints">pints</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground">Target Price (Optional)</label>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="e.g. 4.50" 
                            value={listPrice}
                            onChange={(e) => setListPrice(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-semibold text-foreground">Select Pickup Window</label>
                          <Select value={listWindow} onValueChange={setListWindow}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose window" />
                            </SelectTrigger>
                            <SelectContent>
                              {pickupWindows.map(w => (
                                <SelectItem key={w.id} value={w.id}>
                                  {w.locationLabel} ({w.dayOfWeek} {w.startsAt}-{w.endsAt})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="md:col-span-2 gap-2 mt-2">
                          <Plus className="h-4 w-4" /> Publish Listing
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {(currentRole === "restaurant" || currentRole === "consumer") && (
                  <Card className="border-border/60">
                    <CardHeader>
                      <CardTitle className="font-serif text-xl">Create Sourcing Request</CardTitle>
                      <CardDescription className="text-xs">Let local growers know what your kitchen or household needs for next week.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground">Requested Item Name</label>
                          <Input 
                            placeholder="e.g. Fresh Salad Greens" 
                            value={reqName}
                            onChange={(e) => setReqName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground">Category</label>
                          <Select value={reqCategory} onValueChange={setReqCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Vegetables">Vegetables</SelectItem>
                              <SelectItem value="Greens">Greens</SelectItem>
                              <SelectItem value="Fruit">Fruit</SelectItem>
                              <SelectItem value="Eggs">Eggs</SelectItem>
                              <SelectItem value="Honey">Honey</SelectItem>
                              <SelectItem value="Mushrooms">Mushrooms</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground">Quantity Needed</label>
                            <Input 
                              type="number" 
                              placeholder="e.g. 15" 
                              value={reqQty}
                              onChange={(e) => setReqQty(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground">Unit</label>
                            <Select value={reqUnit} onValueChange={setReqUnit}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lbs">lbs</SelectItem>
                                <SelectItem value="bunches">bunches</SelectItem>
                                <SelectItem value="quarts">quarts</SelectItem>
                                <SelectItem value="dozens">dozens</SelectItem>
                                <SelectItem value="pints">pints</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground">Needed By Date</label>
                          <Input 
                            type="date" 
                            value={reqDate}
                            onChange={(e) => setReqByDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-semibold text-foreground">Timing Flexibility</label>
                          <Select value={reqFlex} onValueChange={(val: any) => setReqFlex(val)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="strict">Strict (Must have on exact date)</SelectItem>
                              <SelectItem value="flexible">Flexible (Within 2-3 days)</SelectItem>
                              <SelectItem value="highly_flexible">Highly Flexible (Anytime next week)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="md:col-span-2 gap-2 mt-2">
                          <Plus className="h-4 w-4" /> Post Sourcing Request
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Live Activity List */}
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold text-foreground">Active Coordination Feed</h3>
                  <div className="space-y-3">
                    {currentRole === "grower" ? (
                      listings.map(l => (
                        <div key={l.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{l.itemName}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>{l.quantity} {l.unit}</span>
                              <span>•</span>
                              <span>Available until {l.availabilityEnd}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            {l.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      requests.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{r.itemName}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>{r.quantity} {r.unit}</span>
                              <span>•</span>
                              <span>Needed by {r.neededBy}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20">
                            {r.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Panel (Matches and Active Chat) */}
              <div className="space-y-8">
                {/* Match Recommendations */}
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Compatible Matches
                    </CardTitle>
                    <CardDescription className="text-xs">Based on local overlaps in timing and harvest categories.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {matches.filter(m => m.status === "open").map(m => (
                      <div 
                        key={m.id} 
                        className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                          activeMatchId === m.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted/30"
                        }`}
                        onClick={() => {
                          setActiveMatchId(m.id);
                          setActiveTab("matches");
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{m.listingName}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {currentRole === "grower" ? `Requested by ${m.requesterName}` : `Offered by ${m.farmName}`}
                            </p>
                          </div>
                          <Badge className="bg-primary text-primary-foreground font-mono text-[10px]">
                            {m.score}% Fit
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-[11px] text-primary font-semibold">
                          <span>Review match & coordinate</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    ))}
                    {matches.filter(m => m.status === "open").length === 0 && (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No pending matches found. Create more listings or requests to trigger recommendations.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pickup Windows / Hubs summary */}
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Pickup Windows
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pickupWindows.map(w => (
                      <div key={w.id} className="p-3 rounded-lg bg-muted/20 border border-border/40 text-xs">
                        <div className="font-semibold text-foreground">{w.locationLabel}</div>
                        <div className="text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {w.address}
                        </div>
                        <div className="text-primary font-medium mt-1">
                          {w.dayOfWeek}s, {w.startsAt} - {w.endsAt}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* COORDINATION TAB (Listings or Requests detail management) */}
          {activeTab === "coordination" && (
            <div className="max-w-4xl mx-auto space-y-8">
              {currentRole === "grower" ? (
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl">My Active Harvest Listings</CardTitle>
                    <CardDescription className="text-xs">These listings are visible to Concord restaurants and consumer meal planners.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {listings.map(l => (
                        <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-border bg-card gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-foreground">{l.itemName}</h3>
                              <Badge variant="secondary" className="text-[10px]">{l.category}</Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-muted-foreground mt-3">
                              <div>
                                <span className="block font-semibold text-foreground">Available Quantity</span>
                                {l.quantity} {l.unit}
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">Target Price</span>
                                {l.price ? `$${l.price.toFixed(2)}/${l.unit}` : "Coordinated directly"}
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">Availability Range</span>
                                {l.availabilityStart} to {l.availabilityEnd}
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">Status</span>
                                <Badge variant="outline" className="mt-0.5 bg-primary/5 text-primary border-primary/20">
                                  {l.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl">My Active Sourcing Requests</CardTitle>
                    <CardDescription className="text-xs">Growers can view these requests and match them with their anticipated harvests.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {requests.map(r => (
                        <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-border bg-card gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-foreground">{r.itemName}</h3>
                              <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-muted-foreground mt-3">
                              <div>
                                <span className="block font-semibold text-foreground">Requested Quantity</span>
                                {r.quantity} {r.unit}
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">Timing Flexibility</span>
                                <span className="capitalize">{r.flexibility.replace("_", " ")}</span>
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">Needed By</span>
                                {r.neededBy}
                              </div>
                              <div>
                                <span className="block font-semibold text-foreground">Status</span>
                                <Badge variant="outline" className="mt-0.5 bg-accent/10 text-accent-foreground border-accent/20">
                                  {r.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* MATCHES & CHAT TAB */}
          {activeTab === "matches" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Match List Sidebar */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-foreground">Matched Sourcing Threads</h3>
                <div className="space-y-3">
                  {matches.map(m => (
                    <div 
                      key={m.id} 
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                        activeMatchId === m.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted/30"
                      }`}
                      onClick={() => setActiveMatchId(m.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{m.listingName}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {currentRole === "grower" ? `Chef ${m.requesterName}` : `Farmer ${m.farmName}`}
                          </p>
                        </div>
                        <Badge className="bg-primary text-primary-foreground font-mono text-[10px]">
                          {m.score}% Fit
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                          {m.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Thread Panel */}
              <div className="lg:col-span-2">
                {activeMatch ? (
                  <Card className="border-border/60 h-[600px] flex flex-col justify-between">
                    <CardHeader className="border-b border-border/40 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-serif text-lg">
                            {activeMatch.listingName} Overlap Thread
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Sourcing match between {activeMatch.farmName} and {activeMatch.requesterName}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className="bg-primary text-primary-foreground font-mono text-[10px]">
                            {activeMatch.score}% Match Compatibility
                          </Badge>
                          {activeMatch.status === "open" && (
                            <Button 
                              size="sm" 
                              onClick={() => acceptMatch(activeMatch.id)}
                              className="text-[10px] px-2 py-0.5 h-auto mt-1"
                            >
                              Lock In Match
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10">
                      {/* Overlap Reasons */}
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                        <div className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" /> Overlap Insights:
                        </div>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {activeMatch.reasons.map((r, rIdx) => (
                            <li key={rIdx} className="flex items-center gap-2">
                              <Check className="h-3 w-3 text-primary" /> {r}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Chat Messages */}
                      <div className="space-y-4 pt-4">
                        {activeMessages.map(msg => {
                          const isMe = msg.senderId === currentUser?.id || 
                                       (currentRole === "grower" && msg.senderRole === "grower") ||
                                       (currentRole === "restaurant" && msg.senderRole === "restaurant");
                          return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] rounded-xl p-4 text-sm leading-relaxed ${
                                isMe 
                                  ? "bg-primary text-primary-foreground rounded-br-none" 
                                  : "bg-card text-foreground border border-border rounded-bl-none shadow-sm"
                              }`}>
                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">
                                  {msg.senderName} ({msg.senderRole})
                                </div>
                                {msg.text}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Input Reply Area */}
                    <CardFooter className="border-t border-border/40 p-4 bg-card">
                      <form onSubmit={handleSendReply} className="flex w-full items-center gap-2">
                        <Input 
                          placeholder="Type your coordination message..." 
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="submit">Send</Button>
                      </form>
                    </CardFooter>
                  </Card>
                ) : (
                  <div className="h-[600px] border border-border rounded-xl flex items-center justify-center text-muted-foreground text-sm">
                    Select a match thread to begin coordinating.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI PLANNER TAB */}
          {activeTab === "ai-planner" && (
            <div className="max-w-3xl mx-auto space-y-8">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    Clover AI Sourcing & Crop Assistant
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Generating dynamic plans strictly grounded in Concord's active listings and demand clusters.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <h3 className="font-bold text-lg font-serif text-foreground">{aiPlan.title}</h3>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      Traceable Sourcing Enabled
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {aiPlan.suggestions.map((item: any, idx: number) => (
                      <div key={idx} className="bg-muted/20 p-5 rounded-xl border border-border/30 space-y-2">
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                          <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Recommendation {idx + 1}
                          </span>
                          {item.label}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.explanation}</p>
                        {item.linkedListingIds.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-primary font-medium pt-1">
                            <Sprout className="h-3.5 w-3.5" />
                            <span>Linked to active Concord harvest listings</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 flex items-start gap-3 text-xs text-accent-foreground leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-accent-foreground" />
                    <div>
                      <span className="font-semibold">Why this works:</span> Every recommendation above is traceable back to Concord farm listings or chef requests. No hallucinations, just efficient regional coordination.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
