/**
 * @fileoverview Conversation state management for chatbot
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Manages conversation state to enable structured, one-question-at-a-time interactions.
 * State-first approach: bot understands where it is in the conversation before responding.
 */

import type { Message } from "@shared/schema";

/**
 * Conversation state - tracks intent, permissions, location, and what we're awaiting
 */
export interface ConversationState {
  intent?: "food" | "shelter" | "health" | "crisis" | "legal" | "youth" | "unknown";
  urgency?: "immediate" | "soon" | "general"; // For food/shelter requests: immediate = now, soon = today, general = planning
  isCrisis?: boolean; // True if user mentions suicide, self-harm, or immediate danger
  isAdult?: boolean; // True if user is an adult (to avoid youth-only resources)
  permissionGranted?: boolean;
  location?: {
    type: "street" | "area" | "intersection" | "city";
    value: string;
  };
  awaiting?: "permission" | "location" | "confirmation" | null;
}

/**
 * Infer conversation state from message history
 * This is called before generating any response to understand where we are
 */
export function inferState(messages: Message[]): ConversationState {
  const state: ConversationState = {
    intent: undefined,
    permissionGranted: false,
    location: undefined,
    awaiting: null,
  };

  // Analyze all messages to build state
  const conversationText = messages.map(m => m.content).join(" ").toLowerCase();
  const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content.toLowerCase() || "";

  // 1. Infer intent from conversation
  if (conversationText.includes("food") || conversationText.includes("meal") || conversationText.includes("hungry") || conversationText.includes("eat")) {
    state.intent = "food";
    
    // Detect urgency for food requests
    const immediateKeywords = ["hungry", "hungry now", "starving", "need food now", "need to eat", "need a meal", "need food today", "no food", "haven't eaten", "havent eaten"];
    const soonKeywords = ["need food", "looking for food", "food today", "meal today"];
    
    if (immediateKeywords.some(kw => lastUserMessage.includes(kw) || conversationText.includes(kw))) {
      state.urgency = "immediate";
    } else if (soonKeywords.some(kw => lastUserMessage.includes(kw) || conversationText.includes(kw))) {
      state.urgency = "soon";
    } else {
      state.urgency = "general";
    }
  } else if (conversationText.includes("shelter") || conversationText.includes("homeless") || conversationText.includes("sleeping outside") || 
             conversationText.includes("cold") || conversationText.includes("freezing") || conversationText.includes("nowhere to sleep") ||
             conversationText.includes("tired") || conversationText.includes("need a place to sleep") || conversationText.includes("need to sleep")) {
    state.intent = "shelter";
    
    // Detect urgency for shelter requests
    const immediateKeywords = ["tired", "cold", "freezing", "need to sleep", "need a place to sleep", "nowhere to sleep", 
                               "sleeping outside", "on the street", "homeless", "need shelter now"];
    if (immediateKeywords.some(kw => lastUserMessage.includes(kw) || conversationText.includes(kw))) {
      state.urgency = "immediate";
    } else {
      state.urgency = "general";
    }
  } else if (conversationText.includes("health") || conversationText.includes("medical") || conversationText.includes("clinic") || 
             conversationText.includes("doctor") || conversationText.includes("healthcare")) {
    state.intent = "health";
  } else if (conversationText.includes("crisis") || conversationText.includes("suicide") || conversationText.includes("mental health crisis") ||
             conversationText.includes("depression") || conversationText.includes("anxiety crisis") ||
             conversationText.includes("self-harm") || conversationText.includes("self harm") || conversationText.includes("hurt myself") ||
             conversationText.includes("want to die") || conversationText.includes("end my life")) {
    state.intent = "crisis";
    state.isCrisis = true; // Mark as crisis situation - requires permission first
  } else if (conversationText.includes("legal") || conversationText.includes("lawyer") || conversationText.includes("legal aid")) {
    state.intent = "legal";
  } else if (conversationText.includes("youth") || conversationText.includes("teen") || conversationText.includes("young people")) {
    state.intent = "youth";
  } else if (conversationText.includes("need") || conversationText.includes("help") || conversationText.includes("looking for") ||
             conversationText.includes("where can i") || conversationText.includes("find")) {
    state.intent = "unknown"; // Intent detected but not specific
  }
  
  // Detect if user is an adult (to avoid youth-only resources)
  const adultKeywords = ["i'm an adult", "i am an adult", "i'm over 18", "i am over 18", "adult", "grown", "parent", "mom", "dad"];
  const youthKeywords = ["i'm a teen", "i am a teen", "i'm under 18", "i am under 18", "teenager", "student", "high school"];
  
  if (adultKeywords.some(kw => conversationText.includes(kw))) {
    state.isAdult = true;
  } else if (youthKeywords.some(kw => conversationText.includes(kw))) {
    state.isAdult = false;
  }

  // 2. Check for permission granted
  const permissionKeywords = ["yes", "sure", "okay", "ok", "please", "that would be great", "that'd be great", 
                              "go ahead", "yes please", "sounds good", "yeah", "yep"];
  const deniedKeywords = ["no", "nope", "don't", "dont", "not", "refuse", "decline"];
  
  // Check if user explicitly granted permission
  if (permissionKeywords.some(kw => lastUserMessage.includes(kw) || conversationText.includes(kw))) {
    state.permissionGranted = true;
  } else if (deniedKeywords.some(kw => lastUserMessage.includes(kw))) {
    state.permissionGranted = false;
  }

  // 3. Extract location information
  const locationPatterns = [
    { pattern: /(?:near|at|on|around)\s+([a-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|way|circle|ct|place|pl))/i, type: "street" as const },
    { pattern: /(?:near|at|around)\s+([a-z\s]+(?:intersection|crossing|crossroads))/i, type: "intersection" as const },
    { pattern: /(?:in|near|at)\s+(downtown|rutland|glenmore|westbank|west\s+kelowna|west\s+side|east\s+kelowna)/i, type: "area" as const },
    { pattern: /(kelowna|west\s+kelowna)/i, type: "city" as const },
  ];

  for (const { pattern, type } of locationPatterns) {
    const match = conversationText.match(pattern);
    if (match) {
      state.location = {
        type,
        value: match[1] || match[0],
      };
      break;
    }
  }

  // 4. Determine what we're awaiting
  // Check if assistant asked for permission in last message
  const lastAssistantMessage = messages.filter(m => m.role === "assistant").pop()?.content.toLowerCase() || "";
  if (lastAssistantMessage.includes("would you like") || lastAssistantMessage.includes("can i") || 
      lastAssistantMessage.includes("may i") || lastAssistantMessage.includes("permission")) {
    if (!state.permissionGranted) {
      state.awaiting = "permission";
    }
  }
  
  // Check if assistant asked for location
  if (lastAssistantMessage.includes("what street") || lastAssistantMessage.includes("what area") || 
      lastAssistantMessage.includes("where are you") || lastAssistantMessage.includes("location") ||
      lastAssistantMessage.includes("near")) {
    if (!state.location) {
      state.awaiting = "location";
    }
  }

  return state;
}

/**
 * Determine what action to take based on state
 * Returns: "ask_permission" | "ask_location" | "fetch_resources" | "present_options"
 */
export function determineAction(state: ConversationState): "ask_permission" | "ask_location" | "fetch_resources" | "present_options" {
  // CRITICAL: For crisis situations, ALWAYS ask permission first - never just offer resources
  if (state.isCrisis && !state.permissionGranted && state.awaiting !== "permission") {
    return "ask_permission";
  }
  
  // If we have intent but no permission, ask for permission first
  if (state.intent && state.intent !== "unknown" && !state.permissionGranted && state.awaiting !== "permission") {
    return "ask_permission";
  }

  // If we have permission but no location (and intent requires location), ask for location
  if (state.intent && state.intent !== "unknown" && state.intent !== "crisis" && 
      state.permissionGranted && !state.location && state.awaiting !== "location") {
    return "ask_location";
  }

  // If we have everything, fetch resources
  if (state.intent && state.intent !== "unknown" && state.permissionGranted && state.location) {
    return "fetch_resources";
  }

  // If we have intent but missing something, ask for what's missing
  if (state.intent && state.intent !== "unknown" && !state.permissionGranted) {
    return "ask_permission";
  }

  if (state.intent && state.intent !== "unknown" && state.permissionGranted && !state.location) {
    return "ask_location";
  }

  // Default: present general options
  return "present_options";
}

