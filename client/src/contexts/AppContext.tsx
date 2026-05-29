import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  FarmProfile, Listing, SourcingRequest, PickupWindow, Match, Message,
  MOCK_FARMS, MOCK_PICKUP_WINDOWS, MOCK_LISTINGS, MOCK_REQUESTS, MOCK_MATCHES, MOCK_MESSAGES
} from "@shared/const";
import { toast } from "sonner";

export type UserRole = "grower" | "restaurant" | "consumer" | "guest";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  farmId?: string;
  restaurantId?: string;
}

interface AppContextType {
  currentUser: User | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  loginAs: (role: UserRole) => void;
  logout: () => void;
  
  farms: FarmProfile[];
  pickupWindows: PickupWindow[];
  listings: Listing[];
  requests: SourcingRequest[];
  matches: Match[];
  messages: Message[];
  
  addListing: (listing: Omit<Listing, "id" | "farmId" | "farmName" | "status">) => void;
  addRequest: (request: Omit<SourcingRequest, "id" | "requesterId" | "requesterName" | "requesterRole" | "status">) => void;
  addPickupWindow: (window: Omit<PickupWindow, "id" | "ownerId">) => void;
  acceptMatch: (matchId: string) => void;
  sendMessage: (matchId: string, text: string) => void;
  
  // AI Planner helpers
  generateWeeklyPlan: (role: UserRole, preferences: string[]) => any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRoleState] = useState<UserRole>("guest");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // App state initialized from mock data
  const [farms, setFarms] = useState<FarmProfile[]>(MOCK_FARMS);
  const [pickupWindows, setPickupWindows] = useState<PickupWindow[]>(MOCK_PICKUP_WINDOWS);
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [requests, setRequests] = useState<SourcingRequest[]>(MOCK_REQUESTS);
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);

  // Synchronize currentUser whenever currentRole changes
  useEffect(() => {
    if (currentRole === "guest") {
      setCurrentUser(null);
    } else if (currentRole === "grower") {
      setCurrentUser({
        id: "grower-user",
        name: "Silas Bartlett",
        email: "silas@maplehillfarm.com",
        role: "grower",
        farmId: "farm-1"
      });
    } else if (currentRole === "restaurant") {
      setCurrentUser({
        id: "restaurant-user",
        name: "Chef Thomas",
        email: "thomas@theconcordtable.com",
        role: "restaurant",
        restaurantId: "rest-1"
      });
    } else if (currentRole === "consumer") {
      setCurrentUser({
        id: "consumer-user",
        name: "Jane Miller",
        email: "jane.miller@gmail.com",
        role: "consumer"
      });
    }
  }, [currentRole]);

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    toast.success(`Switched role to ${role.toUpperCase()}`);
  };

  const loginAs = (role: UserRole) => {
    setCurrentRoleState(role);
    toast.success(`Logged in as ${role.toUpperCase()}`);
  };

  const logout = () => {
    setCurrentRoleState("guest");
    toast.info("Logged out successfully");
  };

  // State mutation actions
  const addListing = (newListing: Omit<Listing, "id" | "farmId" | "farmName" | "status">) => {
    const listing: Listing = {
      ...newListing,
      id: `list-${Date.now()}`,
      farmId: currentUser?.farmId || "farm-1",
      farmName: farms.find(f => f.id === currentUser?.farmId)?.name || "Maple Hill Farm",
      status: "open"
    };
    
    setListings(prev => [listing, ...prev]);
    toast.success("Listing created successfully!");
    
    // Auto matching simulation
    simulateMatchingForListing(listing);
  };

  const addRequest = (newRequest: Omit<SourcingRequest, "id" | "requesterId" | "requesterName" | "requesterRole" | "status">) => {
    const request: SourcingRequest = {
      ...newRequest,
      id: `req-${Date.now()}`,
      requesterId: currentUser?.id || "user-1",
      requesterName: currentUser?.name || "Jane Miller",
      requesterRole: currentRole as "restaurant" | "consumer",
      status: "open"
    };
    
    setRequests(prev => [request, ...prev]);
    toast.success("Sourcing request posted!");
    
    // Auto matching simulation
    simulateMatchingForRequest(request);
  };

  const addPickupWindow = (newWindow: Omit<PickupWindow, "id" | "ownerId">) => {
    const window: PickupWindow = {
      ...newWindow,
      id: `window-${Date.now()}`,
      ownerId: currentUser?.farmId || "farm-1"
    };
    
    setPickupWindows(prev => [...prev, window]);
    toast.success("Pickup window added!");
  };

  const acceptMatch = (matchId: string) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: "matched" } : m));
    toast.success("Match accepted! Sourcing thread initialized.");
  };

  const sendMessage = (matchId: string, text: string) => {
    if (!text.trim()) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      matchId,
      senderId: currentUser?.id || "anonymous",
      senderName: currentUser?.name || "Anonymous",
      senderRole: currentRole as "grower" | "restaurant" | "consumer",
      text,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, msg]);
  };

  // Simple auto-matching simulator to bring prototype to life
  const simulateMatchingForListing = (listing: Listing) => {
    setTimeout(() => {
      // Find compatible requests
      const compatibleRequests = requests.filter(req => 
        req.status === "open" && 
        req.category === listing.category
      );
      
      if (compatibleRequests.length > 0) {
        const targetReq = compatibleRequests[0];
        const score = Math.floor(Math.random() * 15) + 82; // 82 to 96
        const newMatch: Match = {
          id: `match-${Date.now()}`,
          listingId: listing.id,
          requestId: targetReq.id,
          listingName: listing.itemName,
          requestName: targetReq.itemName,
          farmName: listing.farmName,
          requesterName: targetReq.requesterName,
          score,
          reasons: [
            `Category overlap (${listing.category})`,
            "Time compatibility window aligned",
            "Concord area local fulfillment"
          ],
          status: "open",
          createdAt: new Date().toISOString()
        };
        
        setMatches(prev => [newMatch, ...prev]);
        toast.info(`New Match Detected! ${listing.itemName} matches ${targetReq.requesterName}'s request (${score}% compatibility)`);
      }
    }, 1500);
  };

  const simulateMatchingForRequest = (request: SourcingRequest) => {
    setTimeout(() => {
      // Find compatible listings
      const compatibleListings = listings.filter(list => 
        list.status === "open" && 
        list.category === request.category
      );
      
      if (compatibleListings.length > 0) {
        const targetList = compatibleListings[0];
        const score = Math.floor(Math.random() * 15) + 85; // 85 to 99
        const newMatch: Match = {
          id: `match-${Date.now()}`,
          listingId: targetList.id,
          requestId: request.id,
          listingName: targetList.itemName,
          requestName: request.itemName,
          farmName: targetList.farmName,
          requesterName: request.requesterName,
          score,
          reasons: [
            `Category overlap (${request.category})`,
            "Timing overlap verified",
            "Concord local farm partner"
          ],
          status: "open",
          createdAt: new Date().toISOString()
        };
        
        setMatches(prev => [newMatch, ...prev]);
        toast.info(`New Match Detected! ${targetList.farmName}'s ${targetList.itemName} is ${score}% compatible with your request.`);
      }
    }, 1500);
  };

  // AI Sourcing and Meal planner logic
  const generateWeeklyPlan = (role: UserRole, preferences: string[]) => {
    if (role === "consumer") {
      return {
        title: "Weekly Local Meal Plan (Household)",
        fallbackMessage: listings.length === 0 ? "No active local listings to build plan from." : undefined,
        suggestions: [
          {
            label: "Heirloom Tomato & Basil Salad",
            linkedListingIds: ["list-1"],
            explanation: "Based on Maple Hill Farm's current Heirloom Tomato Mix listing. Freshly harvested this week in East Concord.",
            substitutions: ["Cherry tomatoes from backyard gardens"]
          },
          {
            label: "Sautéed Baby Greens & Poached Eggs",
            linkedListingIds: ["list-2", "list-5"],
            explanation: "Combines Baby Kale and Pastured Rainbow Eggs from Maple Hill Farm. Perfect for a quick, low-impact Thursday dinner.",
            substitutions: ["Spinach", "Swiss chard"]
          },
          {
            label: "Raw Honey-Glazed Carrots",
            linkedListingIds: ["list-3"],
            explanation: "Utilizes Clover Ridge Orchards' Raw Wildflower Honey. Pair with local root vegetables.",
            substitutions: ["Maple syrup"]
          }
        ]
      };
    } else if (role === "restaurant") {
      return {
        title: "Seasonal Sourcing & Menu Suggstions (Chef)",
        suggestions: [
          {
            label: "Concord Summer Harvest Salad",
            linkedListingIds: ["list-1", "list-2"],
            explanation: "A high-margin appetizer combining Silas's Heirloom Tomatoes and Baby Kale. Matches your preference for organic greens.",
            substitutions: ["Mixed spring greens"]
          },
          {
            label: "Pan-Seared Salmon with Foraged Mushrooms",
            linkedListingIds: ["list-4"],
            explanation: "Features Brookside Root & Forage's Shiitake Mushrooms. Matches your restaurant's focus on earthy, local flavor profiles.",
            substitutions: ["Oyster mushrooms", "Crimini"]
          }
        ]
      };
    } else {
      return {
        title: "Grower Crop Planning Insights",
        suggestions: [
          {
            label: "Increase Baby Salad Greens Production",
            linkedListingIds: [],
            explanation: "Based on high demand: 2 local restaurants (The Concord Table, Granite State Bistro) currently have active sourcing requests for salad greens.",
            substitutions: []
          },
          {
            label: "Promote Heirloom Tomatoes for Late Week Pickups",
            linkedListingIds: ["list-1"],
            explanation: "Concord Table has an active, strict request for heirloom tomatoes needed by Thursday.",
            substitutions: []
          }
        ]
      };
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, currentRole, setCurrentRole, loginAs, logout,
      farms, pickupWindows, listings, requests, matches, messages,
      addListing, addRequest, addPickupWindow, acceptMatch, sendMessage,
      generateWeeklyPlan
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
