export interface UserProfile {
  name: string;
  age: number;
  weight: number; // lbs
  allergies: string[];
  dietaryChoices: string[];
  healthConditions: string[];
  calorieTarget: number;
  proteinTarget: number; // grams
  carbsTarget: number; // grams
  fatTarget: number; // grams
}

export interface FoodLog {
  id: string;
  timestamp: string; // ISO string
  rawSpeech: string;
  foodName: string;
  quantity: string;
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  allergensDetected: string[];
}

export interface TravelDestination {
  id: string;
  city: string;
  dateRange: string;
  eateries: { name: string; type: string; distance: string; dietMatches: string[] }[];
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "Jane Doe",
  age: 32,
  weight: 145,
  allergies: ["Peanuts", "Gluten"],
  dietaryChoices: ["Vegetarian", "High Protein"],
  healthConditions: ["None"],
  calorieTarget: 2000,
  proteinTarget: 120,
  carbsTarget: 200,
  fatTarget: 65
};

export const MOCK_FOOD_LOGS: FoodLog[] = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    rawSpeech: "I had a bowl of Greek yogurt with blueberries and wildflower honey for breakfast",
    foodName: "Greek Yogurt with Blueberries & Honey",
    quantity: "1 bowl (approx. 250g)",
    calories: 280,
    protein: 18,
    carbs: 35,
    fat: 4,
    allergensDetected: []
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // yesterday
    rawSpeech: "Sautéed some wild shiitake mushrooms with spinach and three eggs for breakfast",
    foodName: "Shiitake & Spinach Egg Scramble",
    quantity: "1 plate (3 eggs, 1 cup veg)",
    calories: 320,
    protein: 21,
    carbs: 8,
    fat: 18,
    allergensDetected: []
  },
  {
    id: "log-3",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // today morning
    rawSpeech: "Grabbed a slice of heirloom tomato galette for lunch",
    foodName: "Heirloom Tomato Galette",
    quantity: "1 slice (approx. 150g)",
    calories: 380,
    protein: 12,
    carbs: 42,
    fat: 16,
    allergensDetected: ["Gluten"] // Warns because of pastry crust
  }
];

export const MOCK_TRAVEL_CALENDAR: TravelDestination[] = [
  {
    id: "travel-1",
    city: "Boston, MA",
    dateRange: "June 4 - June 6",
    eateries: [
      { name: "The Green Lotus Cafe", type: "100% Plant-Based Eatery", distance: "0.4 mi", dietMatches: ["Vegetarian", "Gluten-Free Options"] },
      { name: "Atlantic Fish Co.", type: "Seafood & Grill", distance: "1.2 mi", dietMatches: ["High Protein", "Peanut-Free Facility"] },
      { name: "Pressed Cafe", type: "Healthy Fast Casual", distance: "0.8 mi", dietMatches: ["Vegetarian", "High Protein", "Gluten-Free"] }
    ]
  }
];

export const COOKIE_NAME = "clover_farm_session";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
