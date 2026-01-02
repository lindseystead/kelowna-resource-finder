/**
 * @fileoverview Chat API routes for resource assistance
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Handles chat API endpoints for interactive resource assistance.
 * Integrates with external services with fallback to local database resources.
 */

import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { storage } from "../storage";
import { asyncHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { CHAT } from "../constants";
import { env, isOpenAIConfigured } from "../config";
import { inferState, determineAction, type ConversationState } from "./state";
import type { Resource } from "@shared/schema";

// Initialize OpenAI client if API key is provided (chat is optional)
// baseURL allows using proxies or alternative endpoints
const openai = isOpenAIConfigured()
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY!,
      baseURL: env.OPENAI_BASE_URL,
    })
  : null;

const SYSTEM_PROMPT = `You are a guided resource assistant for Kelowna Resource Finder.

**Your Role:**
You help people find local services in Kelowna and West Kelowna, BC. You are calm, clear, and focused on getting users the right information quickly.

**CRITICAL RULES - You MUST follow these:**

1. **Ask ONE question at a time** - Never ask multiple questions in a single message. Wait for the user's response before asking the next question.

2. **Ask permission before using location** - Before searching for nearby resources, you MUST ask: "Would you like me to look for [resource type] options near you that are open right now?" Wait for their "yes" before asking for location.

3. **Collect minimum information needed** - Only ask for what you actually need. Don't ask for unnecessary personal details.

4. **Prefer open, nearby, verified resources** - When presenting options, prioritize:
   - Resources that are open now
   - Resources closest to the user's location
   - Verified resources (marked with checkmark)

5. **Help users plan next steps** - After presenting resources, help with:
   - Directions (mention Google Maps links)
   - Timing (when they're open, when to call)
   - What to expect (eligibility, what to bring)

**You MUST NOT:**
- Give medical or legal advice (redirect to professionals)
- Invent resources that don't exist
- Overwhelm users with too many options (max 3-5 resources)
- Ask for unnecessary personal details
- Guess information you don't have - ask instead

**Crisis Situations (CRITICAL):**
- If user mentions suicide, self-harm, or wanting to die: ALWAYS ask permission first: "I'm here to help. Can I help you find crisis support and resources near you right now?" Do NOT just offer resources - wait for their permission.
- For immediate emergencies: Direct to 911
- For mental health crisis: Crisis Line 1-888-353-2273 or Kids Help Phone 1-800-668-6868
- For suicide prevention: 988 or Crisis Line 1-888-353-2273

**Age-Appropriate Resources:**
- If user is an adult: Do NOT offer youth-only resources (resources for ages 13-24, youth shelters, etc.)
- If user is a youth: Include youth-specific resources
- When in doubt, ask: "Are you an adult or a youth?" before offering age-specific resources

**Key Resources (for reference):**
- 24/7 Shelters: Gospel Mission 250-763-3737, Bay Ave Shelter 236-420-0899
- **Immediate Food (hungry now):** Community fridges (24/7), meal programs, community kitchens that serve hot meals
- **Food Planning:** Central Okanagan Food Bank 250-763-7161 (may require appointment)
- Youth: Foundry 236-420-2803, BGC Shelter 250-868-8541
- Health: HealthLink 811, Outreach Urban Health 250-868-2230
- General: Dial 211 or visit bc211.ca

**IMPORTANT - Food Requests:**
- If someone says they're "hungry" or "hungry now", prioritize:
  1. Community fridges (24/7 access, no appointment needed)
  2. Meal programs/community kitchens (hot meals, may be open now)
  3. Places serving meals today
  4. Food banks (for planning ahead, may require appointments)
- Never just say "go to the food bank" if they're hungry right now - offer immediate options first

**IMPORTANT - Shelter Requests:**
- If someone says they're "tired and cold" or "need a place to sleep", prioritize:
  1. 24/7 shelters (available right now)
  2. Emergency shelters with space
  3. Always direct them to check the City of Kelowna Shelter Dashboard for real-time availability: https://www.kelowna.ca/our-community/social-wellness/outdoor-overnight-sheltering
- For urgent shelter needs, emphasize checking the live dashboard for current space availability

**Response Style:**
- Be warm and brief (2-3 sentences max)
- One question per message
- Use simple, clear language
- Avoid jargon or technical terms

Remember: You are helping people who may be stressed or in crisis. Be calm, clear, and helpful.`;

/**
 * Registers all chat-related API routes.
 * 
 * @param app - Express application instance
 */
export function registerChatRoutes(app: Express): void {
  /**
   * GET /api/csrf-token
   * Returns the CSRF token for the current session.
   * This endpoint initializes the session and CSRF token if needed.
   * Used by frontend to get the token when cookies aren't accessible cross-origin.
   */
  app.get("/api/csrf-token", asyncHandler(async (req: Request, res: Response) => {
    // The csrfToken middleware should have already set the token
    // Return it in the response body so frontend can read it
    const token = req.session?.csrfToken || res.locals.csrfToken;
    if (!token) {
      return res.status(500).json({ error: "CSRF token not available" });
    }
    res.json({ csrfToken: token });
  }));

  /**
   * GET /api/conversations
   * Retrieves all chat conversations.
   * This endpoint also initializes the session and CSRF token on first request.
   */
  app.get("/api/conversations", asyncHandler(async (req: Request, res: Response) => {
    // Ensure session is initialized (this will create it if it doesn't exist)
    // The csrfToken middleware should have already set the CSRF token cookie
    if (req.session && !req.session.csrfToken) {
      // If for some reason the CSRF token wasn't set, log it (but don't fail)
      if (process.env.NODE_ENV === "development") {
        logger.warn("CSRF token not found in session on GET /api/conversations");
      }
    }
    
    const conversations = await chatStorage.getAllConversations(CHAT.MAX_CONVERSATIONS);
    res.json(conversations);
  }));

  /**
   * GET /api/conversations/:id
   * Retrieves a single conversation with all its messages.
   */
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        logger.error("Error fetching conversation", error);
      }
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  /**
   * POST /api/conversations
   * Creates a new chat conversation.
   */
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      
      // Validate and sanitize title
      const MAX_TITLE_LENGTH = 200;
      const sanitizedTitle = title 
        ? String(title).trim().slice(0, MAX_TITLE_LENGTH) || "New Chat"
        : "New Chat";
      
      if (sanitizedTitle.length === 0) {
        return res.status(400).json({ error: "Title cannot be empty" });
      }
      
      const conversation = await chatStorage.createConversation(sanitizedTitle);
      res.status(201).json(conversation);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        logger.error("Error creating conversation", error);
      }
      const statusCode = error instanceof Error && error.message.includes("Invalid") ? 400 : 500;
      res.status(statusCode).json({ 
        error: error instanceof Error ? error.message : "Failed to create conversation" 
      });
    }
  });

  /**
   * DELETE /api/conversations/:id
   * Deletes a conversation and all its messages.
   */
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        logger.error("Error deleting conversation", error);
      }
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  /**
   * POST /api/conversations/:id/messages
   * Sends a message and streams the AI response using Server-Sent Events (SSE).
   */
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const { content } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      // Validate message length to prevent abuse and token overflow
      const trimmedContent = content.trim();
      if (trimmedContent.length > CHAT.MAX_MESSAGE_LENGTH) {
        return res.status(400).json({ 
          error: `Message too long. Maximum ${CHAT.MAX_MESSAGE_LENGTH} characters allowed.` 
        });
      }

      // Verify conversation exists
      const conversation = await chatStorage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Check OpenAI API key is configured
      if (!isOpenAIConfigured() || !openai) {
        logger.warn("Chat request received but OpenAI API key is not configured");
        // Save user message first
        await chatStorage.createMessage(conversationId, "user", trimmedContent);
        
        // Get fallback resources
        const allResources = await storage.getResources();
        const limitedResources = allResources.slice(0, 5);
        const resourceList = limitedResources.slice(0, 3).map((r: Resource) => 
          `• ${r.name}${r.phone ? ` - ${r.phone}` : ""}${r.address ? ` - ${r.address}` : ""}`
        ).join("\n");
        
        const fallbackMessage = `I'm having trouble connecting to the AI service right now, but here are some helpful resources in Kelowna:\n\n${resourceList}\n\nFor more resources, you can browse by category on the homepage or search using the search bar. For immediate crisis support, please call 1-888-353-2273 or 911 for emergencies.`;
        
        await chatStorage.createMessage(conversationId, "assistant", fallbackMessage);
        
        // Return as JSON (not SSE) since we're not streaming
        return res.status(200).json({ 
          content: fallbackMessage,
          done: true
        });
      }

      // Save user message
      await chatStorage.createMessage(conversationId, "user", trimmedContent);

      // Get conversation history for context (limit to last 10 messages to save tokens)
      // Fetch in reverse order, then reverse to get chronological order
      const messages = (await chatStorage.getMessagesByConversation(conversationId, CHAT.MAX_HISTORY_MESSAGES)).reverse();
      
      // Infer conversation state (intent, permission, location, awaiting)
      const state = inferState(messages);
      const action = determineAction(state);
      
      let resourceContext = "";
      let locationContext = "";
      let stateContext = "";
      
      // Build state context for the LLM
      if (state.intent && state.intent !== "unknown") {
          stateContext += `\n\nCONVERSATION STATE:\n- User intent: ${state.intent}\n`;
          if (state.urgency) {
            stateContext += `- Urgency: ${state.urgency}\n`;
          }
          if (state.isCrisis) {
            stateContext += `- CRISIS SITUATION: User mentioned suicide/self-harm - handle with extra care, ask permission first\n`;
          }
          if (state.isAdult !== undefined) {
            stateContext += `- User is ${state.isAdult ? "an adult" : "a youth"} - ${state.isAdult ? "exclude youth-only resources" : "include youth resources"}\n`;
          }
          stateContext += `- Permission granted: ${state.permissionGranted ? "Yes" : "No"}\n`;
          if (state.location) {
            stateContext += `- Location: ${state.location.value} (${state.location.type})\n`;
          } else {
            stateContext += `- Location: Not provided yet\n`;
          }
          if (state.awaiting) {
            stateContext += `- Currently awaiting: ${state.awaiting}\n`;
          }
        }
      
      // Handle based on action
      if (action === "ask_permission") {
        // Ask for permission to search with location
        let resourceType = state.intent === "shelter" ? "shelter options" : 
                            state.intent === "food" ? "food options" :
                            state.intent === "health" ? "health services" :
                            state.intent === "legal" ? "legal aid services" :
                            "resources";
        
        // For urgent food requests, emphasize immediate options
        if (state.intent === "food" && state.urgency === "immediate") {
          resourceType = "places where you can get food right now";
        }
        
        // For urgent shelter requests, emphasize immediate options
        if (state.intent === "shelter" && state.urgency === "immediate") {
          resourceType = "shelters with space available right now";
        }
        
        // For crisis situations, be more careful and supportive
        if (state.isCrisis) {
          stateContext += `\n\nCRITICAL: User is in crisis (suicide/self-harm mentioned). You MUST ask permission first with: "I'm here to help. Can I help you find crisis support and resources near you right now?" Do NOT just offer resources - wait for their permission.`;
        } else {
          stateContext += `\n\nACTION REQUIRED: Ask the user ONE question: "Would you like me to look for ${resourceType} near you that are open right now?" Wait for their response before asking anything else.`;
        }
      } else if (action === "ask_location") {
        // Ask for location
        stateContext += `\n\nACTION REQUIRED: Ask the user ONE question: "What street or area are you near? An intersection is fine - you don't need to give an exact address." Wait for their response.`;
      } else if (action === "fetch_resources") {
        // Fetch and present resources
        if (state.intent === "shelter" && state.location) {
          // Fetch shelters specifically - prioritize 24/7 and filter by age if known
          const sheltersCategory = await storage.getCategoryBySlug("shelters");
          if (sheltersCategory) {
            let shelters = await storage.getResources({ categoryId: sheltersCategory.id });
            
            // Filter out youth-only shelters if user is an adult
            if (state.isAdult === true) {
              shelters = shelters.filter(s => {
                const nameLower = s.name.toLowerCase();
                const descLower = s.description.toLowerCase();
                // Exclude youth-only shelters for adults
                return !nameLower.includes("youth") && !descLower.includes("youth only") && 
                       !descLower.includes("ages 13-24") && !descLower.includes("ages 16-24");
              });
            }
            
            // For urgent shelter needs, prioritize 24/7 shelters and sort by availability
            if (state.urgency === "immediate") {
              shelters = shelters.sort((a, b) => {
                const aIs247 = a.hours?.toLowerCase().includes("24/7") || a.hours?.toLowerCase().includes("24 hours");
                const bIs247 = b.hours?.toLowerCase().includes("24/7") || b.hours?.toLowerCase().includes("24 hours");
                if (aIs247 && !bIs247) return -1;
                if (!aIs247 && bIs247) return 1;
                
                // Prefer verified resources
                if (a.verified && !b.verified) return -1;
                if (!a.verified && b.verified) return 1;
                
                return a.name.localeCompare(b.name);
              });
            } else {
              // General sorting
              shelters = shelters.sort((a, b) => {
                const aIs247 = a.hours?.toLowerCase().includes("24/7") || a.hours?.toLowerCase().includes("24 hours");
                const bIs247 = b.hours?.toLowerCase().includes("24/7") || b.hours?.toLowerCase().includes("24 hours");
                if (aIs247 && !bIs247) return -1;
                if (!aIs247 && bIs247) return 1;
                return a.name.localeCompare(b.name);
              });
            }
            
            // Format shelter info with emphasis on 24/7 and availability
            const shelterInfo = shelters.slice(0, 5).map(s => {
              let info = `• ${s.name}`;
              if (s.phone) info += ` - Call ${s.phone}`;
              if (s.address) info += ` - ${s.address}`;
              if (s.hours) {
                const is247 = s.hours.toLowerCase().includes("24/7") || s.hours.toLowerCase().includes("24 hours");
                info += is247 ? " (24/7 - available right now)" : ` (Hours: ${s.hours})`;
              }
              return info;
            }).join("\n");
            
            const urgencyNote = state.urgency === "immediate" 
              ? "\n\n**For real-time shelter availability and space:** Check the City of Kelowna Shelter Dashboard at https://www.kelowna.ca/our-community/social-wellness/outdoor-overnight-sheltering - it shows which shelters have space right now."
              : "\n\n**For real-time shelter availability:** Check the City of Kelowna Shelter Dashboard on our website.";
            
            resourceContext = `\n\nNEAREST SHELTERS NEAR YOU:\n${shelterInfo}${urgencyNote}`;
          }
        } else if (state.intent === "food" && state.location) {
            // Fetch food resources - prioritize immediate options for urgent requests
            const allFoodResources = await storage.getResources({ search: "food" });
            
            // For immediate/urgent requests, prioritize:
            // 1. Community kitchens/meal programs (hot meals, open now)
            // 2. Community fridges (24/7 access)
            // 3. Places serving meals today
            // 4. Food banks (for general/planning requests)
            
            let prioritizedResources = allFoodResources;
            
            if (state.urgency === "immediate" || state.urgency === "soon") {
              // Sort by: 24/7 access first, then open now, then meal programs, then food banks
              prioritizedResources = allFoodResources.sort((a, b) => {
                const aIs247 = a.hours?.toLowerCase().includes("24/7") || a.hours?.toLowerCase().includes("24 hours");
                const bIs247 = b.hours?.toLowerCase().includes("24/7") || b.hours?.toLowerCase().includes("24 hours");
                if (aIs247 && !bIs247) return -1;
                if (!aIs247 && bIs247) return 1;
                
                // Check if it's a meal program/kitchen (serves hot meals)
                const aIsMealProgram = a.name.toLowerCase().includes("kitchen") || 
                                      a.name.toLowerCase().includes("meal") ||
                                      a.description.toLowerCase().includes("hot meal") ||
                                      a.description.toLowerCase().includes("lunch") ||
                                      a.description.toLowerCase().includes("dinner") ||
                                      a.description.toLowerCase().includes("breakfast");
                const bIsMealProgram = b.name.toLowerCase().includes("kitchen") || 
                                      b.name.toLowerCase().includes("meal") ||
                                      b.description.toLowerCase().includes("hot meal") ||
                                      b.description.toLowerCase().includes("lunch") ||
                                      b.description.toLowerCase().includes("dinner") ||
                                      b.description.toLowerCase().includes("breakfast");
                if (aIsMealProgram && !bIsMealProgram) return -1;
                if (!aIsMealProgram && bIsMealProgram) return 1;
                
                // Check if it's a community fridge (immediate access)
                const aIsFridge = a.name.toLowerCase().includes("fridge") || 
                                 a.description.toLowerCase().includes("community fridge");
                const bIsFridge = b.name.toLowerCase().includes("fridge") || 
                                b.description.toLowerCase().includes("community fridge");
                if (aIsFridge && !bIsFridge) return -1;
                if (!aIsFridge && bIsFridge) return 1;
                
                // Prefer verified resources
                if (a.verified && !b.verified) return -1;
                if (!a.verified && b.verified) return 1;
                
                return 0;
              });
            }
            
            // Format resource info with emphasis on immediate options
            const resourceInfo = prioritizedResources.slice(0, 5).map(r => {
              let info = `• ${r.name}`;
              if (r.phone) info += ` - ${r.phone}`;
              if (r.address) info += ` - ${r.address}`;
              
              // Add helpful context about what type of service it is
              const is247 = r.hours?.toLowerCase().includes("24/7") || r.hours?.toLowerCase().includes("24 hours");
              const isMealProgram = r.name.toLowerCase().includes("kitchen") || 
                                    r.name.toLowerCase().includes("meal") ||
                                    r.description.toLowerCase().includes("hot meal");
              const isFridge = r.name.toLowerCase().includes("fridge");
              
              if (is247) {
                info += ` (24/7 - available right now)`;
              } else if (isMealProgram) {
                info += ` (serves hot meals${r.hours ? ` - ${r.hours}` : ""})`;
              } else if (isFridge) {
                info += ` (community fridge - take what you need)`;
              } else if (r.hours) {
                info += ` (${r.hours})`;
              }
              
              return info;
            }).join("\n");
            
            const urgencyNote = state.urgency === "immediate" 
              ? "\n\n**For immediate food access right now:** Community fridges and 24/7 options are listed first. If you need a hot meal, check meal programs and community kitchens."
              : state.urgency === "soon"
              ? "\n\n**For food today:** Check meal programs and community kitchens first. Food banks may require appointments."
              : "";
            
            resourceContext = `\n\nFOOD RESOURCES NEAR YOU:\n${resourceInfo}${urgencyNote}`;
          } else if (state.intent === "health" && state.location) {
            // Fetch health resources - filter by age if known
            const category = await storage.getCategoryBySlug("health");
            if (category) {
              let resources = await storage.getResources({ categoryId: category.id });
              
              // Filter out youth-only resources if user is an adult
              if (state.isAdult === true) {
                resources = resources.filter(r => {
                  const nameLower = r.name.toLowerCase();
                  const descLower = r.description.toLowerCase();
                  return !nameLower.includes("youth") && !descLower.includes("youth only") && 
                         !descLower.includes("ages 13-24") && !descLower.includes("ages 16-24") &&
                         !nameLower.includes("foundry") && !nameLower.includes("kids help");
                });
              }
              
              const resourceInfo = resources.slice(0, 5).map(r => {
                let info = `• ${r.name}`;
                if (r.phone) info += ` - ${r.phone}`;
                if (r.address) info += ` - ${r.address}`;
                if (r.hours) info += ` (${r.hours})`;
                return info;
              }).join("\n");
              
              resourceContext = `\n\nNEAREST HEALTH RESOURCES:\n${resourceInfo}`;
            }
          } else if (state.intent === "legal" && state.location) {
            // Fetch legal resources
            const category = await storage.getCategoryBySlug("legal");
            if (category) {
              const resources = await storage.getResources({ categoryId: category.id });
              const resourceInfo = resources.slice(0, 5).map(r => {
                let info = `• ${r.name}`;
                if (r.phone) info += ` - ${r.phone}`;
                if (r.address) info += ` - ${r.address}`;
                if (r.hours) info += ` (${r.hours})`;
                return info;
              }).join("\n");
              
              resourceContext = `\n\nNEAREST LEGAL RESOURCES:\n${resourceInfo}`;
            }
          } else if (state.intent && state.intent !== "unknown" && state.location) {
            // General resource search for other intents - filter by age if known
            let allResources = await storage.getResources({ search: trimmedContent });
            
            // Filter out youth-only resources if user is an adult
            if (state.isAdult === true) {
              allResources = allResources.filter(r => {
                const nameLower = r.name.toLowerCase();
                const descLower = r.description.toLowerCase();
                return !nameLower.includes("youth") && !descLower.includes("youth only") && 
                       !descLower.includes("ages 13-24") && !descLower.includes("ages 16-24");
              });
            }
            
            const resourceInfo = allResources.slice(0, 5).map(r => {
              let info = `• ${r.name}`;
              if (r.phone) info += ` - ${r.phone}`;
              if (r.address) info += ` - ${r.address}`;
              return info;
            }).join("\n");
            
            if (resourceInfo) {
              resourceContext = `\n\nNEAREST RESOURCES:\n${resourceInfo}`;
            }
          }
        }
      
      // Build system content with state context
      const systemContent = SYSTEM_PROMPT + stateContext + 
        (resourceContext ? `\n\nRESOURCES TO PRESENT:\n${resourceContext}` : "") +
        (locationContext ? `\n\n${locationContext}` : "");
      
      const chatMessages: Array<{role: "system" | "user" | "assistant", content: string}> = [
        { role: "system", content: systemContent },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      ];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      let stream;
      try {
        const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
        stream = await openai!.chat.completions.create({
          model: model,
          messages: chatMessages,
          stream: true,
          max_tokens: 256,
          temperature: 0.7,
        });
      } catch (openaiError: unknown) {
        // OpenAI errors can be APIError or other Error types
        const error = openaiError as { message?: string; status?: number; type?: string };
        logger.error("OpenAI API error", { 
          error: error.message || "Unknown error",
          status: error.status,
          type: error.type 
        });
        
        // Fallback: Get generic resources from database
        try {
          // Check if user needs shelter
          const userQueryLower = trimmedContent.toLowerCase();
          const shelterKeywords = ["cold", "freezing", "homeless", "homelessness", "shelter", "sleeping outside", "need a place", "nowhere to sleep", "no place to stay", "sleeping rough", "on the street"];
          const needsShelter = shelterKeywords.some(keyword => userQueryLower.includes(keyword));
          
          let fallbackResponse = "";
          
          if (needsShelter) {
            // Get shelters specifically
            const sheltersCategory = await storage.getCategoryBySlug("shelters");
            if (sheltersCategory) {
              const shelters = await storage.getResources({ categoryId: sheltersCategory.id });
              // Sort by 24/7 availability first
              const sortedShelters = shelters.sort((a, b) => {
                const aIs247 = a.hours?.toLowerCase().includes("24/7") || a.hours?.toLowerCase().includes("24 hours");
                const bIs247 = b.hours?.toLowerCase().includes("24/7") || b.hours?.toLowerCase().includes("24 hours");
                if (aIs247 && !bIs247) return -1;
                if (!aIs247 && bIs247) return 1;
                return a.name.localeCompare(b.name);
              });
              
              fallbackResponse = "I'm here to help you find shelter. **Are you in Kelowna or West Kelowna? What street or area are you near?**\n\n";
              fallbackResponse += "**24/7 Emergency Shelters:**\n";
              
              const emergencyShelters = sortedShelters.filter(s => 
                s.hours?.toLowerCase().includes("24/7") || s.hours?.toLowerCase().includes("24 hours")
              ).slice(0, 3);
              
              emergencyShelters.forEach(s => {
                fallbackResponse += `• **${s.name}**`;
                if (s.phone) fallbackResponse += ` - Call ${s.phone}`;
                if (s.address) fallbackResponse += ` - ${s.address}`;
                fallbackResponse += " (24/7 available)\n";
              });
              
              if (sortedShelters.length > emergencyShelters.length) {
                fallbackResponse += "\n**Other Shelters:**\n";
                sortedShelters.slice(emergencyShelters.length, emergencyShelters.length + 3).forEach(s => {
                  fallbackResponse += `• ${s.name}${s.phone ? ` - ${s.phone}` : ""}${s.address ? ` - ${s.address}` : ""}${s.hours ? ` (${s.hours})` : ""}\n`;
                });
              }
              
              fallbackResponse += "\n**For immediate help:** Call 911 for emergencies or Crisis Line 1-888-353-2273.\n";
              fallbackResponse += "**For real-time shelter availability:** Check the City of Kelowna Shelter Dashboard on our website.";
            } else {
              fallbackResponse = "I'm here to help you find shelter. **Are you in Kelowna or West Kelowna? What street or area are you near?**\n\n";
              fallbackResponse += "**Emergency Shelters:**\n";
              fallbackResponse += "• Kelowna's Gospel Mission - Call 250-763-3737 (24/7)\n";
              fallbackResponse += "• Bay Ave Community Shelter - Call 236-420-0899 (24/7)\n";
              fallbackResponse += "\n**For immediate help:** Call 911 for emergencies or Crisis Line 1-888-353-2273.";
            }
          } else {
            // Regular fallback for other requests
            const allResources = await storage.getResources();
            const limitedResources = allResources.slice(0, 5);
            
            // Categorize resources by type
            const foodResources = limitedResources.filter(r => 
              r.name.toLowerCase().includes("food") || 
              r.name.toLowerCase().includes("meal") ||
              r.description.toLowerCase().includes("food")
            ).slice(0, 2);
            
            const shelterResources = limitedResources.filter(r => 
              r.name.toLowerCase().includes("shelter") || 
              r.name.toLowerCase().includes("housing")
            ).slice(0, 2);
            
            const healthResources = limitedResources.filter(r => 
              r.name.toLowerCase().includes("health") || 
              r.name.toLowerCase().includes("mental") ||
              r.name.toLowerCase().includes("crisis")
            ).slice(0, 2);
            
            fallbackResponse = "I'm having trouble connecting right now, but here are some helpful resources in Kelowna:\n\n";
            
            if (foodResources.length > 0) {
              fallbackResponse += "**Food Resources:**\n";
              foodResources.forEach(r => {
                fallbackResponse += `• ${r.name}${r.phone ? ` - ${r.phone}` : ""}${r.address ? ` - ${r.address}` : ""}\n`;
              });
              fallbackResponse += "\n";
            }
            
            if (shelterResources.length > 0) {
              fallbackResponse += "**Shelter & Housing:**\n";
              shelterResources.forEach(r => {
                fallbackResponse += `• ${r.name}${r.phone ? ` - ${r.phone}` : ""}${r.address ? ` - ${r.address}` : ""}\n`;
              });
              fallbackResponse += "\n";
            }
            
            if (healthResources.length > 0) {
              fallbackResponse += "**Health & Crisis Support:**\n";
              healthResources.forEach(r => {
                fallbackResponse += `• ${r.name}${r.phone ? ` - ${r.phone}` : ""}${r.address ? ` - ${r.address}` : ""}\n`;
              });
              fallbackResponse += "\n";
            }
            
            fallbackResponse += "For more resources, browse by category on the homepage or use the search bar. For immediate crisis support, call 1-888-353-2273 or 911 for emergencies.";
          }
          
          // Save fallback response as assistant message
          await chatStorage.createMessage(conversationId, "assistant", fallbackResponse);
          
          // Check if headers already sent (SSE streaming started)
          if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ content: fallbackResponse })}\n\n`);
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
          } else {
            res.status(200).json({ content: fallbackResponse });
          }
        } catch (fallbackError) {
          logger.error("Fallback error in chat", fallbackError);
          const errorMessage = "I'm having trouble connecting right now. Please try again, or browse resources using the categories on the homepage. For immediate help, call 1-888-353-2273 or 911 for emergencies.";
          
          // Save error message
          try {
            await chatStorage.createMessage(conversationId, "assistant", errorMessage);
          } catch {}
          
          if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
            res.end();
          } else {
            res.status(500).json({ error: errorMessage });
          }
        }
        return;
      }

      let fullResponse = "";

      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        // Save assistant message
        if (fullResponse.trim()) {
          await chatStorage.createMessage(conversationId, "assistant", fullResponse);
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (streamError) {
        logger.error("Stream error in chat", streamError);
        
        // Fallback: Get generic resources from database
        try {
          // Check if user needs shelter
          const userQueryLower = trimmedContent.toLowerCase();
          const shelterKeywords = ["cold", "freezing", "homeless", "homelessness", "shelter", "sleeping outside", "need a place", "nowhere to sleep", "no place to stay", "sleeping rough", "on the street"];
          const needsShelter = shelterKeywords.some(keyword => userQueryLower.includes(keyword));
          
          let fallbackResponse = "";
          
          if (needsShelter) {
            // Get shelters specifically
            const sheltersCategory = await storage.getCategoryBySlug("shelters");
            if (sheltersCategory) {
              const shelters = await storage.getResources({ categoryId: sheltersCategory.id });
              const sortedShelters = shelters.sort((a, b) => {
                const aIs247 = a.hours?.toLowerCase().includes("24/7") || a.hours?.toLowerCase().includes("24 hours");
                const bIs247 = b.hours?.toLowerCase().includes("24/7") || b.hours?.toLowerCase().includes("24 hours");
                if (aIs247 && !bIs247) return -1;
                if (!aIs247 && bIs247) return 1;
                return a.name.localeCompare(b.name);
              });
              
              fallbackResponse = "I'm here to help you find shelter. **Are you in Kelowna or West Kelowna? What street or area are you near?**\n\n";
              fallbackResponse += "**24/7 Emergency Shelters:**\n";
              
              const emergencyShelters = sortedShelters.filter(s => 
                s.hours?.toLowerCase().includes("24/7") || s.hours?.toLowerCase().includes("24 hours")
              ).slice(0, 3);
              
              emergencyShelters.forEach(s => {
                fallbackResponse += `• **${s.name}**${s.phone ? ` - Call ${s.phone}` : ""}${s.address ? ` - ${s.address}` : ""} (24/7 available)\n`;
              });
              
              if (sortedShelters.length > emergencyShelters.length) {
                fallbackResponse += "\n**Other Shelters:**\n";
                sortedShelters.slice(emergencyShelters.length, emergencyShelters.length + 2).forEach(s => {
                  fallbackResponse += `• ${s.name}${s.phone ? ` - ${s.phone}` : ""}${s.address ? ` - ${s.address}` : ""}${s.hours ? ` (${s.hours})` : ""}\n`;
                });
              }
              
              fallbackResponse += "\n**For immediate help:** Call 911 for emergencies or Crisis Line 1-888-353-2273.\n";
              fallbackResponse += "**For real-time shelter availability:** Check the City of Kelowna Shelter Dashboard.";
            } else {
              fallbackResponse = "I'm here to help you find shelter. **Are you in Kelowna or West Kelowna? What street or area are you near?**\n\n";
              fallbackResponse += "**Emergency Shelters:**\n";
              fallbackResponse += "• Kelowna's Gospel Mission - Call 250-763-3737 (24/7)\n";
              fallbackResponse += "• Bay Ave Community Shelter - Call 236-420-0899 (24/7)\n";
              fallbackResponse += "\n**For immediate help:** Call 911 for emergencies or Crisis Line 1-888-353-2273.";
            }
          } else {
            // Regular fallback
            const allResources = await storage.getResources();
            const limitedResources = allResources.slice(0, 5);
            
            const foodResources = limitedResources.filter(r => 
              r.name.toLowerCase().includes("food") || 
              r.name.toLowerCase().includes("meal")
            ).slice(0, 2);
            
            const shelterResources = limitedResources.filter(r => 
              r.name.toLowerCase().includes("shelter") || 
              r.name.toLowerCase().includes("housing")
            ).slice(0, 2);
            
            fallbackResponse = "I'm having trouble connecting right now, but here are some helpful resources:\n\n";
            
            if (foodResources.length > 0) {
              fallbackResponse += "**Food Resources:**\n";
              foodResources.forEach(r => {
                fallbackResponse += `• ${r.name}${r.phone ? ` - ${r.phone}` : ""}\n`;
              });
              fallbackResponse += "\n";
            }
            
            if (shelterResources.length > 0) {
              fallbackResponse += "**Shelter & Housing:**\n";
              shelterResources.forEach(r => {
                fallbackResponse += `• ${r.name}${r.phone ? ` - ${r.phone}` : ""}\n`;
              });
              fallbackResponse += "\n";
            }
            
            fallbackResponse += "For more resources, browse by category on the homepage. For immediate crisis support, call 1-888-353-2273 or 911.";
          }
          
          await chatStorage.createMessage(conversationId, "assistant", fallbackResponse);
          
          if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ content: fallbackResponse })}\n\n`);
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
          } else {
            res.status(200).json({ content: fallbackResponse });
          }
        } catch (fallbackError) {
          const errorMessage = "I'm having trouble connecting right now. Please try again or browse resources on the homepage. For immediate help, call 1-888-353-2273 or 911.";
          try {
            await chatStorage.createMessage(conversationId, "assistant", errorMessage);
          } catch {}
          
          if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
            res.end();
          } else {
            res.status(500).json({ error: errorMessage });
          }
        }
      }
    } catch (error) {
      logger.error("Error sending message", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        const statusCode = error instanceof Error && error.message.includes("API key") ? 401 : 500;
        res.status(statusCode).json({ error: "Failed to send message" });
      }
    }
  });
}

