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
  
  useEffect(() => {
    if (isOpen && !hasShownGreeting && messages.length === 0 && conversationId === null) {
      const greetingMessage: Message = {
        id: Date.now(),
        role: "assistant",
        content: "Hello! I'm here to help you find the support and resources you need in Kelowna. Whether you're looking for food, shelter, health services, or other assistance, I'm here to listen and help guide you. How can I support you today?",
      };
      setMessages([greetingMessage]);
      setHasShownGreeting(true);
    }
  }, [isOpen, hasShownGreeting, messages.length, conversationId]);

  const getCsrfToken = (): string | null => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  const startConversation = async () => {
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }
    
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers,
      body: JSON.stringify({ title: "Support Chat" }),
      credentials: "include",
    });
    const data = await res.json();
    setConversationId(data.id);
    return data.id;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    let convId = conversationId;
    if (!convId) {
      convId = await startConversation();
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
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }
      
      const response = await fetch(`/api/conversations/${convId}/messages`, {
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
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error sending message:", error);
      }
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        setIsLoading(false);
        return;
      }
      
      // Show user-friendly error message
      const errorMessage = error?.message || "Failed to send message";
      
      // Try to get generic resources from database as fallback
      try {
        const resourcesResponse = await fetch("/api/resources");
        if (resourcesResponse.ok && isMountedRef.current) {
          const resources = await resourcesResponse.json();
          const resourceList = resources.slice(0, 3).map((r: any) => 
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
            className="fixed bottom-16 sm:bottom-24 right-2 sm:right-4 w-[calc(100vw-1rem)] sm:w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 flex flex-col"
            style={{ 
              height: "calc(100vh - 4.5rem - env(safe-area-inset-bottom, 0px))",
              maxHeight: "calc(100vh - 4.5rem - env(safe-area-inset-bottom, 0px))",
              marginBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0))',
              marginRight: 'max(0.5rem, env(safe-area-inset-right, 0))',
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
                        className="px-2.5 sm:px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-100 transition-colors active:scale-95 touch-manipulation"
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
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 resize-none border border-slate-200 rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 touch-manipulation min-h-[44px]"
                  rows={1}
                  disabled={isLoading}
                  data-testid="input-chat-message"
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
              <p className="text-[9px] sm:text-xs text-center text-gray-400 mt-1.5 sm:mt-2 px-1 leading-tight">
                For emergencies, call 911 or Crisis Line: 1-888-353-2273
              </p>
              <p className="text-[8px] sm:text-[10px] text-center text-gray-400 mt-0.5 sm:mt-1 px-1 leading-tight">
                Resource helper provides information only, not medical or legal advice.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center z-50 transition-colors touch-manipulation min-w-[56px] min-h-[56px] sm:min-w-[64px] sm:min-h-[64px] ${
          isOpen ? "bg-slate-700 hover:bg-slate-600 active:bg-slate-800" : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
        }`}
        style={{
          bottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom, 0)))',
          right: 'max(1rem, calc(1rem + env(safe-area-inset-right, 0)))',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-testid="button-toggle-chat"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
        ) : (
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
        )}
      </motion.button>
    </>
  );
}
