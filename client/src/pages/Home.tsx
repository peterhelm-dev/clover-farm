import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MOCK_FARMS, MOCK_CROPS, MOCK_RECIPES, FarmStand, SeasonalCrop, Recipe 
} from "@shared/const";
import { 
  Sparkles, Calendar, MapPin, Check, ChevronRight, Sprout, ShoppingBag, Leaf, Clock, Award
} from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  // Filter variables
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth() + 1 + ""); // 1-12
  const [dietaryPref, setDietaryPref] = useState<string>("all");
  const [householdSize, setHouseholdSize] = useState<string>("2");
  
  // Generation state
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);

  const months = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April (Spring)" }, { value: "5", label: "May (Spring)" }, { value: "6", label: "June (Early Summer)" },
    { value: "7", label: "July (Summer)" }, { value: "8", label: "August (Summer)" }, { value: "9", label: "September (Autumn)" },
    { value: "10", label: "October (Autumn)" }, { value: "11", label: "November" }, { value: "12", label: "December" }
  ];

  // AI curation algorithm simulation
  const handleGeneratePlan = () => {
    setLoading(true);
    setGeneratedPlan(null);

    setTimeout(() => {
      const monthNum = parseInt(selectedMonth);
      
      // 1. Find crops currently in season in Concord, NH
      const inSeasonCrops = MOCK_CROPS.filter(crop => crop.monthsInSeason.includes(monthNum));
      const inSeasonCropIds = inSeasonCrops.map(c => c.id);

      // 2. Select recipes that utilize at least one in-season local crop
      let compatibleRecipes = MOCK_RECIPES.filter(recipe => 
        recipe.localIngredients.some(ing => inSeasonCropIds.includes(ing.cropId))
      );

      // Apply vegetarian filters if selected
      if (dietaryPref === "vegetarian") {
        compatibleRecipes = compatibleRecipes.filter(r => 
          !r.name.toLowerCase().includes("salmon") && !r.name.toLowerCase().includes("chicken")
        );
      }

      // If no recipes matched (e.g. winter months), fallback to year-round staples (eggs/honey)
      if (compatibleRecipes.length === 0) {
        compatibleRecipes = MOCK_RECIPES.filter(recipe => 
          recipe.localIngredients.some(ing => ing.cropId === "crop-3" || ing.cropId === "crop-9")
        );
      }

      // 3. Assemble a zero-waste 3-day meal plan
      const selectedRecipes = compatibleRecipes.slice(0, 3);
      
      // 4. Build a consolidated local shopping list categorized by farm stand
      const shoppingList: { [farmId: string]: { cropName: string; quantity: string }[] } = {};
      
      selectedRecipes.forEach(recipe => {
        recipe.localIngredients.forEach(ing => {
          const crop = MOCK_CROPS.find(c => c.id === ing.cropId);
          if (crop) {
            const farmId = crop.primaryFarmId;
            if (!shoppingList[farmId]) {
              shoppingList[farmId] = [];
            }
            // Check if already in list to avoid duplicates
            if (!shoppingList[farmId].some(item => item.cropName === crop.name)) {
              shoppingList[farmId].push({
                cropName: crop.name,
                quantity: ing.quantity
              });
            }
          }
        });
      });

      setGeneratedPlan({
        monthName: months.find(m => m.value === selectedMonth)?.label,
        recipes: selectedRecipes,
        shoppingList,
        inSeasonCrops
      });

      setLoading(false);
      toast.success("AI Seasonal Plan curated successfully!");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-serif text-xl font-bold tracking-tight text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            <span>Clover AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Concord, NH Regional Engine
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-5xl space-y-12">
          
          {/* Hero Curation Pitch */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Curated Seasonal Curation
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-serif text-foreground">
              Clover AI Food Planner
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Standard AI meal planners recommend ingredients flown in from across the globe. Clover AI is different—it is grounded strictly in the Concord, NH agricultural calendar and local farm stand inventories.
            </p>
          </div>

          {/* Interactive Input Form */}
          <Card className="border-border/60 shadow-sm max-w-3xl mx-auto">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Customize Your Local Plan
              </CardTitle>
              <CardDescription className="text-xs">
                Configure your plan parameters. We will evaluate active seasonal crops in USDA Zone 5b.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Month Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Current Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dietary Preference */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Dietary Focus</label>
                  <Select value={dietaryPref} onValueChange={setDietaryPref}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">No Restrictions</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Household Size */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Household Size</label>
                  <Select value={householdSize} onValueChange={setHouseholdSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Person</SelectItem>
                      <SelectItem value="2">2 People</SelectItem>
                      <SelectItem value="4">Family (4 People)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGeneratePlan} 
                disabled={loading} 
                className="w-full mt-6 gap-2"
              >
                {loading ? "Curating Local Harvest Calendars..." : "Curate My Seasonal Meal Plan"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Generated Plan Output */}
          {generatedPlan && (
            <div className="space-y-10 pt-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
              
              {/* Seasonality Insights */}
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  In Season for {generatedPlan.monthName} (Concord, NH)
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  These crops are currently harvest-ready in our region. Our AI has curated your recipes around these exact items.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {generatedPlan.inSeasonCrops.map((crop: SeasonalCrop) => (
                    <Badge key={crop.id} variant="secondary" className="bg-card border border-border/60 text-xs px-3 py-1 font-medium text-foreground">
                      {crop.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recipe Cards */}
              <div className="space-y-6">
                <h3 className="font-serif text-2xl font-bold text-foreground">Curated Meals</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {generatedPlan.recipes.map((recipe: Recipe) => (
                    <Card key={recipe.id} className="border-border/60 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
                      <div>
                        <div className="h-44 bg-muted relative">
                          <img src={recipe.imageUrl} alt={recipe.name} className="object-cover w-full h-full" />
                          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground font-sans text-[10px]">
                            {recipe.category}
                          </Badge>
                        </div>
                        <CardHeader className="p-4">
                          <CardTitle className="font-serif text-base font-bold leading-tight">{recipe.name}</CardTitle>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{recipe.prepTime + recipe.cookTime} mins total</span>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 pt-0 space-y-3">
                          <div>
                            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block mb-1">Local Ingredients:</span>
                            <ul className="space-y-1">
                              {recipe.localIngredients.map((ing, idx) => {
                                const crop = MOCK_CROPS.find(c => c.id === ing.cropId);
                                return (
                                  <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>{ing.quantity} <strong>{crop?.name}</strong></span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block mb-1">Pantry Staples:</span>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {recipe.pantryIngredients.join(", ")}
                            </p>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Local Shopping List */}
              <div className="border-t border-border/40 pt-10">
                <h3 className="font-serif text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  Your Local Farm Stand Shopping List
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.keys(generatedPlan.shoppingList).map(farmId => {
                    const farm = MOCK_FARMS.find(f => f.id === farmId);
                    const items = generatedPlan.shoppingList[farmId];
                    if (!farm) return null;
                    return (
                      <Card key={farmId} className="border-border/60 bg-muted/20">
                        <CardHeader className="p-4 border-b border-border/40">
                          <CardTitle className="font-serif text-sm font-bold text-foreground">{farm.name}</CardTitle>
                          <CardDescription className="text-[11px] flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-primary shrink-0" /> {farm.location}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <ul className="space-y-2">
                            {items.map((item: any, idx: number) => (
                              <li key={idx} className="text-xs text-foreground flex items-center gap-2">
                                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5" />
                                <span>{item.quantity} of <strong>{item.cropName}</strong></span>
                              </li>
                            ))}
                          </ul>
                          <div className="pt-2 border-t border-border/20 text-[10px] text-muted-foreground space-y-1">
                            <div><strong className="text-foreground">Open:</strong> {farm.daysOpen.join(", ")}</div>
                            <div><strong className="text-foreground">Hours:</strong> {farm.hours}</div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Philosophy Section */}
          <div className="border-t border-border/40 pt-12 max-w-3xl mx-auto text-center space-y-4">
            <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-foreground">Our Curation Philosophy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We do not believe in AI food hallucinations. Every ingredient suggested above is mapped to actual local farm stands in the Concord, NH region based on seasonal availability. We help you support local agriculture by making meal planning easy, delicious, and waste-free.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 py-8 text-muted-foreground text-center text-xs">
        <div className="container">
          <p>© 2026 Clover AI. Curating regional food systems with predictive seasonal logic.</p>
        </div>
      </footer>
    </div>
  );
}
