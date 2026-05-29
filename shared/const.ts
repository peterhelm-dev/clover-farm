export interface FarmStand {
  id: string;
  name: string;
  farmer: string;
  address: string;
  location: string;
  daysOpen: string[];
  hours: string;
  specialty: string;
  phone: string;
  imageUrl: string;
}

export interface SeasonalCrop {
  id: string;
  name: string;
  category: "Vegetables" | "Greens" | "Fruit" | "Eggs" | "Honey" | "Mushrooms" | "Herbs";
  monthsInSeason: number[]; // 1-12
  primaryFarmId: string;
  description: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  localIngredients: { cropId: string; quantity: string }[];
  pantryIngredients: string[];
  instructions: string[];
  imageUrl: string;
}

export const MOCK_FARMS: FarmStand[] = [
  {
    id: "farm-1",
    name: "Maple Hill Farm Stand",
    farmer: "Silas & Sarah Bartlett",
    address: "248 Portsmouth St, Concord, NH 03301",
    location: "East Concord",
    daysOpen: ["Thursday", "Friday", "Saturday"],
    hours: "10:00 AM - 6:00 PM",
    specialty: "Certified Organic Greens, Heirloom Tomatoes, & Pastured Eggs",
    phone: "(603) 555-0143",
    imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "farm-2",
    name: "Clover Ridge Orchard Store",
    farmer: "Evelyn Carter",
    address: "110 Orchard Rd, Penacook, NH 03303",
    location: "Penacook",
    daysOpen: ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    hours: "9:00 AM - 5:00 PM",
    specialty: "Tree Fruits, Berries, Fresh Cider, & Wildflower Honey",
    phone: "(603) 555-0178",
    imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "farm-3",
    name: "Brookside Root & Forage",
    farmer: "Marcus Thorne",
    address: "45 Woodhill Rd, Bow, NH 03304",
    location: "Bow",
    daysOpen: ["Tuesday", "Thursday", "Saturday"],
    hours: "11:00 AM - 6:00 PM",
    specialty: "Forest Mushrooms, Wild Herbs, Garlic, & Root Crops",
    phone: "(603) 555-0199",
    imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80"
  }
];

export const MOCK_CROPS: SeasonalCrop[] = [
  // Spring/Early Summer (Months 4, 5, 6)
  { id: "crop-1", name: "Baby Kale", category: "Greens", monthsInSeason: [4, 5, 6, 9, 10], primaryFarmId: "farm-1", description: "Tender, cold-hardy baby kale leaves, perfect for fresh salads." },
  { id: "crop-2", name: "Fresh Spinach", category: "Greens", monthsInSeason: [4, 5, 6, 9, 10], primaryFarmId: "farm-1", description: "Crisp and sweet spinach harvested in the cool morning." },
  { id: "crop-3", name: "Pastured Eggs", category: "Eggs", monthsInSeason: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], primaryFarmId: "farm-1", description: "Rich, colorful rainbow eggs from free-ranging hens." },
  { id: "crop-4", name: "Shiitake Mushrooms", category: "Mushrooms", monthsInSeason: [4, 5, 6, 7, 8, 9, 10], primaryFarmId: "farm-3", description: "Earthy, wood-grown shiitake mushrooms with dense caps." },
  { id: "crop-5", name: "Wild Foraged Ramps", category: "Herbs", monthsInSeason: [4, 5], primaryFarmId: "farm-3", description: "Highly prized wild leeks with a delicate garlic-onion flavor." },
  
  // Mid/Late Summer (Months 7, 8, 9)
  { id: "crop-6", name: "Heirloom Tomatoes", category: "Vegetables", monthsInSeason: [7, 8, 9], primaryFarmId: "farm-1", description: "Sweet, multi-colored Brandywine and Cherokee Purple heirlooms." },
  { id: "crop-7", name: "Sweet Corn", category: "Vegetables", monthsInSeason: [7, 8, 9], primaryFarmId: "farm-1", description: "Butter-and-sugar sweet corn, picked daily at sunrise." },
  { id: "crop-8", name: "Fresh Blueberries", category: "Fruit", monthsInSeason: [7, 8], primaryFarmId: "farm-2", description: "Plump, sun-ripened highbush blueberries." },
  { id: "crop-9", name: "Wildflower Honey", category: "Honey", monthsInSeason: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], primaryFarmId: "farm-2", description: "Raw, unfiltered honey from orchard wildflower hives." },
  { id: "crop-10", name: "Sweet Strawberries", category: "Fruit", monthsInSeason: [6], primaryFarmId: "farm-2", description: "Fragrant, sweet, and juicy red strawberries." },
  
  // Autumn (Months 9, 10, 11)
  { id: "crop-11", name: "Macintosh Apples", category: "Fruit", monthsInSeason: [9, 10, 11], primaryFarmId: "farm-2", description: "Crisp, tart apples ideal for fresh eating or baking." },
  { id: "crop-12", name: "Butternut Squash", category: "Vegetables", monthsInSeason: [9, 10, 11, 12], primaryFarmId: "farm-3", description: "Sweet, nutty winter squash with dense orange flesh." },
  { id: "crop-13", name: "Rainbow Carrots", category: "Vegetables", monthsInSeason: [8, 9, 10, 11], primaryFarmId: "farm-3", description: "Sweet, crunchy multi-colored root carrots." }
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: "rec-1",
    name: "Spring Farmstand Scramble",
    category: "Breakfast",
    prepTime: 10,
    cookTime: 10,
    servings: 2,
    localIngredients: [
      { cropId: "crop-3", quantity: "4 large" }, // Pastured Eggs
      { cropId: "crop-2", quantity: "2 cups" }, // Spinach
      { cropId: "crop-4", quantity: "1 cup sliced" } // Shiitake Mushrooms
    ],
    pantryIngredients: ["1 tbsp butter", "Salt and black pepper", "1/4 cup shredded cheddar cheese"],
    instructions: [
      "Gently wipe shiitake mushrooms clean with a damp paper towel and slice thin.",
      "Melt butter in a non-stick skillet over medium heat. Add sliced shiitakes and sauté for 4-5 minutes until browned.",
      "Whisk pastured eggs in a bowl with a pinch of salt and pepper.",
      "Add fresh spinach to the skillet and toss for 1 minute until just wilted.",
      "Pour in the whisked eggs, reduce heat to low, and scramble gently with a spatula until soft curds form.",
      "Sprinkle cheddar cheese on top, let melt for 30 seconds, and serve hot."
    ],
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "rec-2",
    name: "Heirloom Tomato & Basil Galette",
    category: "Dinner",
    prepTime: 20,
    cookTime: 35,
    servings: 4,
    localIngredients: [
      { cropId: "crop-6", quantity: "3 medium" }, // Heirloom Tomatoes
      { cropId: "crop-9", quantity: "1 tbsp" } // Wildflower Honey
    ],
    pantryIngredients: ["1 pre-made pie crust", "1/2 cup ricotta cheese", "1 egg (for wash)", "Salt, pepper, fresh basil leaves"],
    instructions: [
      "Slice heirloom tomatoes into 1/4-inch thick rounds. Lay on paper towels and sprinkle with salt to draw out excess moisture.",
      "Preheat oven to 400°F (200°C) and line a baking sheet with parchment paper.",
      "Roll out the pie crust onto the parchment paper. Spread ricotta cheese in the center, leaving a 2-inch border.",
      "Pat tomatoes dry and layer them over the ricotta. Drizzle with wildflower honey and a pinch of black pepper.",
      "Fold the crust edges over the tomatoes, pleating as you go. Brush crust with egg wash.",
      "Bake for 30-35 minutes until the crust is golden brown. Garnish with fresh basil before slicing."
    ],
    imageUrl: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "rec-3",
    name: "Honey-Glazed Roasted Rainbow Carrots",
    category: "Lunch",
    prepTime: 10,
    cookTime: 25,
    servings: 3,
    localIngredients: [
      { cropId: "crop-13", quantity: "1 bunch" }, // Rainbow Carrots
      { cropId: "crop-9", quantity: "2 tbsp" } // Wildflower Honey
    ],
    pantryIngredients: ["1.5 tbsp olive oil", "Salt and pepper", "Fresh thyme sprigs"],
    instructions: [
      "Preheat oven to 400°F (200°C). Scrub carrots clean (no need to peel if organic) and slice in half lengthwise.",
      "Toss carrots on a baking sheet with olive oil, salt, pepper, and fresh thyme.",
      "Roast for 15 minutes, then drizzle the raw wildflower honey evenly over the carrots and toss.",
      "Return to the oven for another 10 minutes until carrots are tender and the edges are caramelized."
    ],
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "rec-4",
    name: "Orchard Apple & Kale Warm Salad",
    category: "Dinner",
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    localIngredients: [
      { cropId: "crop-1", quantity: "4 cups" }, // Baby Kale
      { cropId: "crop-11", quantity: "1 large" }, // Macintosh Apples
      { cropId: "crop-9", quantity: "1 tsp" } // Wildflower Honey
    ],
    pantryIngredients: ["2 tbsp olive oil", "1 tbsp apple cider vinegar", "1/4 cup walnuts", "1/4 cup crumbled goat cheese"],
    instructions: [
      "Core and thinly slice the Macintosh apple.",
      "In a large skillet, heat 1 tbsp of olive oil over medium-low heat. Add apple slices and sauté for 3 minutes until slightly soft.",
      "Whisk remaining olive oil, apple cider vinegar, wildflower honey, and salt in a small bowl.",
      "Add baby kale to the skillet and toss with the warm apples for 1-2 minutes until kale just starts to wilt and turn bright green.",
      "Transfer to a serving bowl, drizzle with the vinaigrette, and top with walnuts and crumbled goat cheese."
    ],
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"
  }
];

export const COOKIE_NAME = "clover_farm_session";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
