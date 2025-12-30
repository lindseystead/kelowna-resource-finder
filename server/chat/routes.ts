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

// Initialize OpenAI client if API key is provided (chat is optional)
// baseURL allows using proxies or alternative endpoints
const openai = isOpenAIConfigured()
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY!,
      baseURL: env.OPENAI_BASE_URL,
    })
  : null;

const SYSTEM_PROMPT = `You're a helpful assistant for Kelowna Resource Finder. Help people find local services in Kelowna, BC.

**Rules:**
- No medical/legal advice. Redirect to professionals.
- For crises: 911 or Crisis Line 1-888-353-2273
- Be warm, brief (2-3 sentences), provide 1-2 resources max
- Ask clarifying questions if needed

**Location-Based Help:**
- When user asks for ANY resource (food, shelter, health, etc.):
  1. FIRST ask: "Are you in Kelowna or West Kelowna? What street or area are you near?"
  2. Once location is provided, share nearest resources with phone numbers and addresses
  3. Prioritize resources closest to their area

**Special Priority for Shelter/Homelessness:**
- If user mentions being cold, needing shelter, homelessness, or sleeping outside:
  - Ask for location immediately
  - Prioritize 24/7 emergency shelters
  - Include real-time availability info when available

**Key Resources:**
- Crisis: 911, Crisis Line 1-888-353-2273, Kids Help Phone 1-800-668-6868
- 24/7: Gospel Mission 250-763-3737 (meals/shelter), Bay Ave Shelter 236-420-0899
- Food: Central Okanagan Food Bank 250-763-7161
- Youth: Foundry 236-420-2803, BGC Shelter 250-868-8541
- Health: HealthLink 811, Outreach Urban Health 250-868-2230
- Other: Dial 211 or bc211.ca

**App Help:**
- Search bar, browse categories, map view, save favorites

Keep responses short and helpful.`;

/**
 * Registers all chat-related API routes.
 * 
 * @param app - Express application instance
 */
export function registerChatRoutes(app: Express): void {
  /**
   * GET /api/conversations
   * Retrieves all chat conversations.
   */
  app.get("/api/conversations", asyncHandler(async (req: Request, res: Response) => {
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
        const resourceList = limitedResources.slice(0, 3).map((r: any) => 
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
      
      // Detect resource needs (food, shelter, health, etc.)
      const userQueryLower = trimmedContent.toLowerCase();
      const shelterKeywords = ["cold", "freezing", "homeless", "homelessness", "shelter", "sleeping outside", "need a place", "nowhere to sleep", "no place to stay", "sleeping rough", "on the street"];
      const needsShelter = shelterKeywords.some(keyword => userQueryLower.includes(keyword));
      
      // Detect other resource requests
      const resourceKeywords = ["food", "meal", "hungry", "health", "clinic", "doctor", "medical", "counseling", "mental health", "legal", "lawyer", "aid", "help", "service", "resource", "need", "looking for", "find", "where"];
      const needsResource = resourceKeywords.some(keyword => userQueryLower.includes(keyword)) || 
                           userQueryLower.includes("i need") || 
                           userQueryLower.includes("looking for") ||
                           userQueryLower.includes("where can i");
      
      // Check conversation history for location information
      const conversationText = messages.map(m => m.content).join(" ").toLowerCase();
      const hasLocation = conversationText.includes("kelowna") || 
                         conversationText.includes("west kelowna") ||
                         conversationText.includes("street") ||
                         conversationText.includes("avenue") ||
                         conversationText.includes("road") ||
                         conversationText.includes("near") ||
                         conversationText.includes("downtown") ||
                         conversationText.includes("rutland") ||
                         conversationText.includes("glenmore");
      
      let resourceContext = "";
      let locationContext = "";
      
      // Handle resource requests with location
      if (needsShelter || needsResource) {
        if (!hasLocation) {
          // Ask for location for any resource request
          const resourceType = needsShelter ? "shelter" : "resources";
          locationContext = `\n\nIMPORTANT: User needs ${resourceType}. Ask for their location (Kelowna/West Kelowna and street/area) before providing resource information.`;
        } else {
          // Location provided - fetch relevant resources
          if (needsShelter) {
            // Fetch shelters specifically
            const sheltersCategory = await storage.getCategoryBySlug("shelters");
            if (sheltersCategory) {
              const shelters = await storage.getResources({ categoryId: sheltersCategory.id });
              // Sort by relevance (24/7 shelters first, then by name)
              const sortedShelters = shelters.sort((a, b) => {
                const aIs247 = a.hours?.toLowerCase().includes("24/7") || a.hours?.toLowerCase().includes("24 hours");
                const bIs247 = b.hours?.toLowerCase().includes("24/7") || b.hours?.toLowerCase().includes("24 hours");
                if (aIs247 && !bIs247) return -1;
                if (!aIs247 && bIs247) return 1;
                return a.name.localeCompare(b.name);
              });
              
              // Format shelter info with availability
              const shelterInfo = sortedShelters.slice(0, 5).map(s => {
                let info = `• ${s.name}`;
                if (s.phone) info += ` - Call ${s.phone}`;
                if (s.address) info += ` - ${s.address}`;
                if (s.hours) {
                  const is247 = s.hours.toLowerCase().includes("24/7") || s.hours.toLowerCase().includes("24 hours");
                  info += is247 ? " (24/7 available)" : ` (Hours: ${s.hours})`;
                }
                return info;
              }).join("\n");
              
              resourceContext = `\n\nNEAREST SHELTERS IN KELOWNA/WEST KELOWNA:\n${shelterInfo}\n\nFor real-time shelter availability, check the City of Kelowna Shelter Dashboard.`;
            }
          } else {
            // Fetch resources based on query
            let categorySlug = null;
            if (userQueryLower.includes("food") || userQueryLower.includes("meal") || userQueryLower.includes("hungry")) {
              categorySlug = "food-banks";
            } else if (userQueryLower.includes("health") || userQueryLower.includes("medical") || userQueryLower.includes("clinic") || userQueryLower.includes("doctor")) {
              categorySlug = "health";
            } else if (userQueryLower.includes("legal") || userQueryLower.includes("lawyer")) {
              categorySlug = "legal";
            }
            
            if (categorySlug) {
              const category = await storage.getCategoryBySlug(categorySlug);
              if (category) {
                const resources = await storage.getResources({ categoryId: category.id });
                const resourceInfo = resources.slice(0, 5).map(r => {
                  let info = `• ${r.name}`;
                  if (r.phone) info += ` - ${r.phone}`;
                  if (r.address) info += ` - ${r.address}`;
                  if (r.hours) info += ` (${r.hours})`;
                  return info;
                }).join("\n");
                
                resourceContext = `\n\nNEAREST ${category.name.toUpperCase()} RESOURCES:\n${resourceInfo}`;
              }
            } else {
              // General resource search
              const allResources = await storage.getResources({ search: trimmedContent });
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
        }
      } else {
        // General queries - still check if they need location
        const needsResourceList = userQueryLower.includes("list") || 
                                  userQueryLower.includes("all") || 
                                  userQueryLower.includes("show me") ||
                                  userQueryLower.includes("what");
        
        if (needsResourceList && !hasLocation) {
          locationContext = "\n\nIMPORTANT: Ask for user's location (Kelowna/West Kelowna and street/area) to provide nearest resources.";
        } else if (needsResourceList) {
          // Only fetch resources if needed - limit to 10 most relevant to save tokens
          const allResources = await storage.getResources();
          const limitedResources = allResources.slice(0, 10);
          resourceContext = limitedResources
            .map(
              (resource) =>
                `${resource.name}${resource.phone ? `: ${resource.phone}` : ""}`
            )
            .join(", ");
        }
      }
      
      const systemContent = (resourceContext || locationContext)
        ? SYSTEM_PROMPT + locationContext + (resourceContext ? `\n\nResources: ${resourceContext}` : "")
        : SYSTEM_PROMPT;
      
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
      } catch (openaiError: any) {
        logger.error("OpenAI API error", { 
          error: openaiError?.message || "Unknown error",
          status: openaiError?.status,
          type: openaiError?.type 
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

