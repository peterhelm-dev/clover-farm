export interface FarmProfile {
  id: string;
  name: string;
  farmerName: string;
  location: string;
  description: string;
  categories: string[];
  growingMethods: string[];
  certifications: string[];
  imageUrl: string;
  pickupNotes: string;
}

export interface Listing {
  id: string;
  farmId: string;
  farmName: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  price?: number;
  availabilityStart: string;
  availabilityEnd: string;
  pickupWindowId: string;
  status: 'open' | 'matched' | 'scheduled' | 'completed' | 'expired';
}

export interface SourcingRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: 'restaurant' | 'consumer';
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  neededBy: string;
  flexibility: 'strict' | 'flexible' | 'highly_flexible';
  status: 'open' | 'matched' | 'scheduled' | 'completed' | 'expired';
}

export interface PickupWindow {
  id: string;
  ownerId: string;
  locationLabel: string;
  address: string;
  dayOfWeek: string;
  startsAt: string;
  endsAt: string;
  instructions: string;
}

export interface Match {
  id: string;
  listingId: string;
  requestId: string;
  listingName: string;
  requestName: string;
  farmName: string;
  requesterName: string;
  score: number;
  reasons: string[];
  status: 'open' | 'matched' | 'scheduled' | 'completed' | 'canceled';
  createdAt: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  senderName: string;
  senderRole: 'grower' | 'restaurant' | 'consumer';
  text: string;
  createdAt: string;
}

export const MOCK_FARMS: FarmProfile[] = [
  {
    id: "farm-1",
    name: "Maple Hill Farm",
    farmerName: "Silas and Sarah Bartlett",
    location: "East Concord, NH",
    description: "A multi-generational family farm specializing in organic heirloom vegetables, pastured eggs, and cold-hardy greens. We focus on soil health and biodiversity.",
    categories: ["Vegetables", "Eggs", "Greens"],
    growingMethods: ["Certified Organic", "No-Till", "Regenerative"],
    certifications: ["USDA Organic", "NH Certified Organic"],
    imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80",
    pickupNotes: "Pickup at the main red barn farm stand. Park by the silos."
  },
  {
    id: "farm-2",
    name: "Clover Ridge Orchards",
    farmerName: "Evelyn Carter",
    location: "Penacook, NH",
    description: "Specializing in tree fruits, berries, and raw wildflower honey. Our orchards have been managed sustainably for over 40 years, using integrated pest management.",
    categories: ["Fruit", "Berries", "Honey"],
    growingMethods: ["Integrated Pest Management", "Sustainable"],
    certifications: ["IPM Certified"],
    imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=80",
    pickupNotes: "Pickup at the packing shed. Follow the orchard driveway."
  },
  {
    id: "farm-3",
    name: "Brookside Root & Forage",
    farmerName: "Marcus Thorne",
    location: "Bow, NH",
    description: "Dedicated to premium root vegetables, forest-grown mushrooms, and wild-foraged herbs. We supply Concord's finest kitchens with unique, earthy ingredients.",
    categories: ["Vegetables", "Mushrooms", "Herbs"],
    growingMethods: ["Wild-Foraged", "Biodynamic", "Organic Practice"],
    certifications: ["Naturally Grown"],
    imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80",
    pickupNotes: "Pickup by the farm greenhouse. Ring the bell by the double doors."
  }
];

export const MOCK_PICKUP_WINDOWS: PickupWindow[] = [
  {
    id: "window-1",
    ownerId: "farm-1",
    locationLabel: "Maple Hill Farm Stand",
    address: "248 Portsmouth St, Concord, NH 03301",
    dayOfWeek: "Thursday",
    startsAt: "15:00",
    endsAt: "18:00",
    instructions: "Look for the green chalkboard listing today's fresh harvests."
  },
  {
    id: "window-2",
    ownerId: "farm-1",
    locationLabel: "Concord Farmers Market Hub",
    address: "Capitol St (Behind State House), Concord, NH 03301",
    dayOfWeek: "Saturday",
    startsAt: "08:30",
    endsAt: "12:00",
    instructions: "Booth #14. Tell us your coordination code for quick pickup."
  },
  {
    id: "window-3",
    ownerId: "farm-2",
    locationLabel: "Clover Ridge Farm Store",
    address: "110 Orchard Rd, Penacook, NH 03303",
    dayOfWeek: "Friday",
    startsAt: "14:00",
    endsAt: "17:30",
    instructions: "Inside the farm store. Ask for Evelyn at the register."
  },
  {
    id: "window-4",
    ownerId: "farm-3",
    locationLabel: "Brookside Greenhouse Drop",
    address: "45 Woodhill Rd, Bow, NH 03304",
    dayOfWeek: "Wednesday",
    startsAt: "16:00",
    endsAt: "19:00",
    instructions: "Bins are labeled alphabetically in the cold storage vestibule."
  }
];

export const MOCK_LISTINGS: Listing[] = [
  {
    id: "list-1",
    farmId: "farm-1",
    farmName: "Maple Hill Farm",
    itemName: "Heirloom Tomato Mix",
    category: "Vegetables",
    quantity: 45,
    unit: "lbs",
    price: 4.50,
    availabilityStart: "2026-06-01",
    availabilityEnd: "2026-06-08",
    pickupWindowId: "window-1",
    status: "open"
  },
  {
    id: "list-2",
    farmId: "farm-1",
    farmName: "Maple Hill Farm",
    itemName: "Tender Baby Kale",
    category: "Greens",
    quantity: 20,
    unit: "bunches",
    price: 3.00,
    availabilityStart: "2026-06-01",
    availabilityEnd: "2026-06-05",
    pickupWindowId: "window-1",
    status: "open"
  },
  {
    id: "list-3",
    farmId: "farm-2",
    farmName: "Clover Ridge Orchards",
    itemName: "Wildflower Honey (Raw)",
    category: "Honey",
    quantity: 15,
    unit: "quarts",
    price: 12.00,
    availabilityStart: "2026-06-01",
    availabilityEnd: "2026-06-30",
    pickupWindowId: "window-3",
    status: "open"
  },
  {
    id: "list-4",
    farmId: "farm-3",
    farmName: "Brookside Root & Forage",
    itemName: "Shiitake Mushrooms",
    category: "Mushrooms",
    quantity: 12,
    unit: "lbs",
    price: 9.00,
    availabilityStart: "2026-06-02",
    availabilityEnd: "2026-06-06",
    pickupWindowId: "window-4",
    status: "open"
  },
  {
    id: "list-5",
    farmId: "farm-1",
    farmName: "Maple Hill Farm",
    itemName: "Pastured Rainbow Eggs",
    category: "Eggs",
    quantity: 30,
    unit: "dozens",
    price: 6.00,
    availabilityStart: "2026-06-01",
    availabilityEnd: "2026-06-08",
    pickupWindowId: "window-2",
    status: "open"
  }
];

export const MOCK_REQUESTS: SourcingRequest[] = [
  {
    id: "req-1",
    requesterId: "rest-1",
    requesterName: "The Concord Table",
    requesterRole: "restaurant",
    itemName: "Organic Salad Greens",
    category: "Greens",
    quantity: 15,
    unit: "lbs",
    neededBy: "2026-06-04",
    flexibility: "flexible",
    status: "open"
  },
  {
    id: "req-2",
    requesterId: "rest-1",
    requesterName: "The Concord Table",
    requesterRole: "restaurant",
    itemName: "Heirloom Tomatoes",
    category: "Vegetables",
    quantity: 30,
    unit: "lbs",
    neededBy: "2026-06-04",
    flexibility: "strict",
    status: "open"
  },
  {
    id: "req-3",
    requesterId: "user-1",
    requesterName: "Jane Miller (Household)",
    requesterRole: "consumer",
    itemName: "Fresh Berries",
    category: "Fruit",
    quantity: 4,
    unit: "pints",
    neededBy: "2026-06-05",
    flexibility: "highly_flexible",
    status: "open"
  },
  {
    id: "req-4",
    requesterId: "rest-2",
    requesterName: "Granite State Bistro",
    requesterRole: "restaurant",
    itemName: "Specialty Mushrooms",
    category: "Mushrooms",
    quantity: 10,
    unit: "lbs",
    neededBy: "2026-06-03",
    flexibility: "flexible",
    status: "open"
  }
];

export const MOCK_MATCHES: Match[] = [
  {
    id: "match-1",
    listingId: "list-2",
    requestId: "req-1",
    listingName: "Tender Baby Kale",
    requestName: "Organic Salad Greens",
    farmName: "Maple Hill Farm",
    requesterName: "The Concord Table",
    score: 92,
    reasons: [
      "Category overlap (Greens)",
      "Timing overlap (Available Jun 1-5, needed Jun 4)",
      "Location compatible (East Concord to Concord Downtown)",
      "Quantity fits request (20 bunches available, 15 lbs needed)"
    ],
    status: "open",
    createdAt: "2026-05-29T10:00:00Z"
  },
  {
    id: "match-2",
    listingId: "list-1",
    requestId: "req-2",
    listingName: "Heirloom Tomato Mix",
    requestName: "Heirloom Tomatoes",
    farmName: "Maple Hill Farm",
    requesterName: "The Concord Table",
    score: 98,
    reasons: [
      "Exact product name match",
      "Perfect timing overlap (Available Jun 1-8, needed Jun 4)",
      "Sufficient supply (45 lbs available, 30 lbs needed)",
      "Location compatible (East Concord to Concord Downtown)"
    ],
    status: "open",
    createdAt: "2026-05-29T10:15:00Z"
  },
  {
    id: "match-3",
    listingId: "list-4",
    requestId: "req-4",
    listingName: "Shiitake Mushrooms",
    requestName: "Specialty Mushrooms",
    farmName: "Brookside Root & Forage",
    requesterName: "Granite State Bistro",
    score: 88,
    reasons: [
      "Category match (Mushrooms)",
      "Timing compatible (Available Jun 2-6, needed Jun 3)",
      "Sufficient supply (12 lbs available, 10 lbs needed)"
    ],
    status: "open",
    createdAt: "2026-05-29T11:00:00Z"
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: "msg-1",
    matchId: "match-2",
    senderId: "farm-1",
    senderName: "Silas Bartlett",
    senderRole: "grower",
    text: "Hi Chef! We have a gorgeous batch of heirlooms ripening up for next week. They're looking incredibly sweet. Will our Thursday pickup window at the farm work for you?",
    createdAt: "2026-05-29T10:30:00Z"
  },
  {
    id: "msg-2",
    matchId: "match-2",
    senderId: "rest-1",
    senderName: "Chef Thomas",
    senderRole: "restaurant",
    text: "Hello Silas! Those tomatoes sound perfect for our weekend feature. Yes, Thursday pickup works great. I can send my sous chef by around 4:00 PM. Could you set aside 30 lbs of the larger Brandywine varieties if possible?",
    createdAt: "2026-05-29T11:15:00Z"
  },
  {
    id: "msg-3",
    matchId: "match-2",
    senderId: "farm-1",
    senderName: "Silas Bartlett",
    senderRole: "grower",
    text: "Absolutely, I will hand-select the best Brandywines and label the box for 'The Concord Table'. See your team on Thursday at 4!",
    createdAt: "2026-05-29T11:45:00Z"
  }
];

// App Template compatibility constants
export const COOKIE_NAME = "clover_farm_session";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
