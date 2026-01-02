/**
 * @fileoverview Interactive chat widget for resource assistance
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Provides an interactive chat interface to help users find community resources.
 * Includes fallback to database resources if external services are unavailable.
 */

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";
import type { Resource } from "@shared/schema";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [hasShownGreeting, setHasShownGreeting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const maxHeight = 120; // Max ~5 lines
      const newHeight = Math.min(inputRef.current.scrollHeight, maxHeight);
      inputRef.current.style.height = `${newHeight}px`;
      inputRef.current.style.overflowY = inputRef.current.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [input]);
  
  // Initialize CSRF token by making a GET request when chat opens
  useEffect(() => {
    if (isOpen && !hasShownGreeting && messages.length === 0 && conversationId === null) {
      // First, fetch CSRF token by making a GET request to initialize session
      const initCsrfToken = async () => {
        try {
          // Make a GET request to initialize session and get CSRF token cookie
          const res = await fetch(apiUrl("/api/conversations"), {
            method: "GET",
            credentials: "include",
            headers: {
              "Accept": "application/json",
            },
          });
          
          // Check if CSRF token cookie was set
          if (res.ok) {
            const token = await getCsrfToken();
            if (import.meta.env.DEV && token) {
              console.log("CSRF token initialized:", token.substring(0, 8) + "...");
            }
          } else if (import.meta.env.DEV) {
            console.warn("Failed to initialize CSRF token:", res.status, res.statusText);
          }
        } catch (error) {
          // Log error but continue - we'll try to get token on first POST
          if (import.meta.env.DEV) {
            console.warn("Failed to initialize CSRF token:", error);
          }
        }
      };
      
      initCsrfToken();
      
      const greetingMessage: Message = {
        id: Date.now(),
        role: "assistant",
        content: "Hello! I'm here to help you find the support and resources you need in Kelowna. Whether you're looking for food, shelter, health services, or other assistance, I'm here to listen and help guide you. How can I support you today?",
      };
      setMessages([greetingMessage]);
      setHasShownGreeting(true);
    }
  }, [isOpen, hasShownGreeting, messages.length, conversationId]);

  // Cache for CSRF token (since we can't read cross-origin cookies)
  const [csrfTokenCache, setCsrfTokenCache] = useState<string | null>(null);

  const getCsrfToken = async (): Promise<string | null> => {
    // First try to read from cookie (works in same-origin)
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        const token = decodeURIComponent(value);
        setCsrfTokenCache(token);
        return token;
      }
    }
    
    // If not in cookie, try cache
    if (csrfTokenCache) {
      return csrfTokenCache;
    }
    
    // If not in cache, fetch from API endpoint
    try {
      const res = await fetch(apiUrl("/api/csrf-token"), {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
        },
      });
      
      if (res.ok) {
        const data = await res.json() as { csrfToken: string };
        if (data.csrfToken) {
          setCsrfTokenCache(data.csrfToken);
          return data.csrfToken;
        }
      }
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    }
    
    return null;
  };

  const startConversation = async () => {
    try {
      // First, ensure we have a CSRF token
      // For cross-origin requests, we can't read cookies from Railway domain,
      // so we fetch the token from a dedicated endpoint
      let csrfToken = await getCsrfToken();
      
      // If we still don't have a token, try initializing session first
      if (!csrfToken) {
        try {
          // Make a GET request to initialize session
          await fetch(apiUrl("/api/conversations"), {
            method: "GET",
            credentials: "include",
            headers: {
              "Accept": "application/json",
            },
          });
          
          // Wait a moment for session to be created
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Try to get token again
          csrfToken = await getCsrfToken();
        } catch (error) {
          console.error("Failed to initialize session:", error);
        }
      }
      
      if (!csrfToken) {
        throw new Error("Unable to obtain CSRF token. Please refresh the page and try again.");
      }
      
      const headers: Record<string, string> = { 
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      };
      
      const url = apiUrl("/api/conversations");
      
      // Debug logging
      if (import.meta.env.DEV) {
        console.log("Creating conversation:", {
          url,
          hasToken: !!csrfToken,
          hasApiUrl: !!import.meta.env.VITE_API_URL,
        });
      }
      
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ title: "Support Chat" }),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        const errorMsg = errorData.error || `Failed to create conversation: ${res.statusText}`;
        
        // Enhanced error logging
        console.error("Chat API error:", {
          status: res.status,
          statusText: res.statusText,
          url,
          error: errorMsg,
          hasToken: !!csrfToken,
          hasApiUrl: !!import.meta.env.VITE_API_URL,
        });
        
        // If CSRF error, provide helpful message
        if (res.status === 403 && (errorMsg.includes("CSRF") || errorMsg.includes("csrf") || errorMsg.includes("token"))) {
          const helpfulMsg = "CSRF token issue. Please refresh the page and try again. If the problem persists, check that cookies are enabled and CORS is configured correctly.";
          throw new Error(helpfulMsg);
        }
        
        throw new Error(errorMsg);
      }
      
      const data = await res.json();
      if (!data.id) {
        throw new Error("Invalid response from server: missing conversation ID");
      }
      
      setConversationId(data.id);
      return data.id;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Failed to start conversation:", errMsg);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    let convId = conversationId;
    if (!convId) {
      try {
        convId = await startConversation();
        if (!convId) {
          throw new Error("Failed to create conversation");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to start conversation";
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: "assistant",
            content: `I'm having trouble connecting right now. Please try refreshing the page. Error: ${errorMsg}`,
          },
        ]);
        setIsLoading(false);
        return;
      }
      
      if (!isMountedRef.current) {
        setIsLoading(false);
        return;
      }
    }

    const newUserMessage: Message = {
      id: Date.now(),
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      // Ensure CSRF token is available - fetch it if missing
      let csrfToken = await getCsrfToken();
      if (!csrfToken) {
        // Try to initialize CSRF token by making a GET request
        try {
          await fetch(apiUrl("/api/conversations"), {
            method: "GET",
            credentials: "include",
          });
          csrfToken = await getCsrfToken();
        } catch (error) {
          // Continue anyway - server might still accept the request
        }
      }
      
      if (!csrfToken) {
        throw new Error("Unable to obtain CSRF token. Please refresh the page and try again.");
      }
      
      const headers: Record<string, string> = { 
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      };
      
      if (!convId) {
        throw new Error("Conversation ID is missing");
      }
      
      const response = await fetch(apiUrl(`/api/conversations/${convId}/messages`), {
        method: "POST",
        headers,
        body: JSON.stringify({ content: userMessage }),
        credentials: "include",
      });

      // Check content type to determine if it's JSON (error/fallback) or SSE stream
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("application/json")) {
        // Handle JSON response (fallback or error)
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        // If it's a fallback response with content, add it as a message
        if (data.content && isMountedRef.current) {
          setMessages((prev) => [
            ...prev,
            { id: Date.now(), role: "assistant", content: data.content },
          ]);
        }
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      if (!isMountedRef.current) {
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantMessageId = Date.now() + 1;

      if (!isMountedRef.current) {
        setIsLoading(false);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      if (reader) {
        while (true) {
          if (!isMountedRef.current) {
            reader.cancel();
            setIsLoading(false);
            return;
          }

          const { done, value } = await reader.read();
          if (done) break;
          if (!isMountedRef.current) {
            setIsLoading(false);
            return;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!isMountedRef.current) break;
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  assistantContent += data.content;
                  if (isMountedRef.current) {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: assistantContent }
                          : m
                      )
                    );
                  }
                } else if (data.error) {
                  throw new Error(data.error);
                } else if (data.done) {
                  break;
                }
              } catch (parseError) {
                // Continue on parse errors
              }
            }
          }
        }
      }
    } catch (error: unknown) {
      // Log error for debugging (even in production, but only to console)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (process.env.NODE_ENV === 'development') {
        console.warn("Chat message error:", errorMessage);
      }
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        setIsLoading(false);
        return;
      }
      
      // Show user-friendly error message with more detail
      let errorDisplayMessage = "Sorry, something went wrong. Please try again.";
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorDisplayMessage = "Unable to connect to the chat service. Please check your internet connection and try again.";
      } else if (errorMessage.includes('CSRF') || errorMessage.includes('csrf') || errorMessage.includes('403')) {
        errorDisplayMessage = "Security token issue. Please refresh the page and try again.";
      } else if (errorMessage.includes('404')) {
        errorDisplayMessage = "Chat service not found. Please check that the backend is running.";
      } else if (errorMessage.includes('500')) {
        errorDisplayMessage = "Server error. Please try again in a moment.";
      }
      
      // Log error details for debugging (even in production for now)
      console.error("Chat error:", {
        message: errorMessage,
        url: apiUrl("/api/conversations"),
        hasApiUrl: !!import.meta.env.VITE_API_URL,
      });
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "assistant",
          content: errorDisplayMessage,
        },
      ]);
      
      // Try to get generic resources from database as fallback
      try {
        const resourcesResponse = await fetch(apiUrl("/api/resources"));
        if (resourcesResponse.ok && isMountedRef.current) {
          const resources = await resourcesResponse.json() as Resource[];
          const resourceList = resources.slice(0, 3).map((r: Resource) => 
            `• ${r.name}${r.phone ? ` - ${r.phone}` : ""}${r.address ? ` - ${r.address}` : ""}`
          ).join("\n");
          
          if (isMountedRef.current) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                role: "assistant",
                content: `I'm having trouble connecting right now, but here are some helpful resources in Kelowna:\n\n${resourceList}\n\nFor more resources, you can browse by category on the homepage or search using the search bar. For immediate crisis support, please call 1-888-353-2273 or 911 for emergencies.`,
              },
            ]);
          }
        } else {
          throw new Error("Could not fetch resources");
        }
      } catch (fallbackError) {
        // If even fallback fails, show generic message
        if (isMountedRef.current) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              role: "assistant",
              content: "I apologize, but I'm having trouble responding right now. Please try again, or browse resources using the categories on the homepage. For immediate help, call our crisis line at 1-888-353-2273 or 911 for emergencies.",
            },
          ]);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={[
              // Mobile: full-width "sheet" that doesn't fight the keyboard/header.
              "fixed left-0 right-0 bottom-0",
              // Desktop: floating panel
              "sm:bottom-24 sm:right-4 sm:left-auto sm:w-[380px] sm:max-w-[calc(100vw-2rem)]",
              "bg-white shadow-lg border border-gray-200 overflow-hidden z-[60] flex flex-col",
              "rounded-t-xl sm:rounded-xl",
            ].join(" ")}
            style={{ 
              // Use dvh to behave better when the mobile keyboard is open.
              // Fallback to vh for iOS Safari < 15.4
              top: "max(4rem, calc(4rem + env(safe-area-inset-top, 0px)))",
              height: "calc(100vh - 4rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))",
              maxHeight: "calc(100vh - 4rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))",
              // Mobile full-width, desktop keeps margins
              maxWidth: "calc(100vw - 1rem)",
              marginLeft: "0",
              marginRight: "0",
              marginBottom: "0",
            }}
            data-testid="chat-widget-panel"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 sm:p-4 text-white shadow-sm shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm shrink-0">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm sm:text-lg text-white truncate">Resource Helper</h3>
                    <p className="text-xs sm:text-sm text-blue-100 truncate">Here to help you find support</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/10 active:bg-white/20 shrink-0 min-w-[44px] min-h-[44px]"
                  data-testid="button-close-chat"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 bg-gray-50 min-h-0">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-base sm:text-lg text-gray-900 mb-2">How can I help you today?</h4>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-xs mx-auto px-2">
                    I can help you find food, shelter, health services, or other resources in Kelowna. I can also help you navigate this app and plan your next steps.
                  </p>
                  <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2 px-2">
                    {[
                      "I need food today",
                      "Looking for shelter tonight",
                      "I need emergency housing tonight",
                      "Mental health support",
                      "Help for families with kids",
                      "Help with legal issues"
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                          setTimeout(() => sendMessage(), 100);
                        }}
                        className="px-2.5 sm:px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-100 active:bg-gray-200 active:scale-[0.98] transition-all duration-150 touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2"
                        data-testid={`button-suggestion-${suggestion.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === "user" ? "bg-blue-500 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-xl break-words ${
                      message.role === "user"
                        ? "bg-blue-500 text-white rounded-tr-md shadow-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-md shadow-sm"
                    }`}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-xl rounded-tl-md">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-2 sm:p-4 bg-white border-t border-gray-200 shrink-0">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    // Limit input length to prevent abuse (2000 chars is reasonable for chat)
                    const value = e.target.value;
                    if (value.length <= 2000) {
                      setInput(value);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 resize-none border border-slate-200 rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 touch-manipulation min-h-[44px] max-h-[120px] overflow-y-auto break-words overflow-wrap-anywhere"
                  rows={1}
                  disabled={isLoading}
                  data-testid="input-chat-message"
                  maxLength={2000}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="rounded-xl px-3 sm:px-4 min-w-[44px] min-h-[44px] h-auto touch-manipulation shrink-0"
                  data-testid="button-send-message"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-center text-gray-400 mt-1.5 sm:mt-2 px-1 leading-tight">
                For emergencies, call 911 or Crisis Line: 1-888-353-2273
              </p>
              <p className="text-xs text-center text-gray-400 mt-0.5 sm:mt-1 px-1 leading-tight">
                Resource helper provides information only, not medical or legal advice.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center z-[60] transition-all duration-150 touch-manipulation min-w-[56px] min-h-[56px] sm:min-w-[64px] sm:min-h-[64px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2"
          style={{
            bottom: "max(1rem, calc(1rem + env(safe-area-inset-bottom, 0px)))",
            right: "max(1rem, calc(1rem + env(safe-area-inset-right, 0px)))",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid="button-toggle-chat"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
        </motion.button>
      )}
    </>
  );
}
