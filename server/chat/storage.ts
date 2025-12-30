/**
 * @fileoverview Chat storage implementation
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Implements chat storage interface for managing conversations and messages in the database.
 */

import { db } from "../db";
import { pool } from "../db";
import { conversations, messages, type Conversation, type Message } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IChatStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(maxCount?: number): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number, maxCount?: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id: number) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  },

  async getAllConversations(maxCount?: number) {
    const queryLimit = maxCount ? Math.min(maxCount, 100) : 100;
    return db.select().from(conversations).orderBy(desc(conversations.createdAt)).limit(queryLimit);
  },

  async createConversation(title: string) {
    const [conversation] = await db.insert(conversations).values({ title }).returning();
    return conversation;
  },

  async deleteConversation(id: number) {
    // Use transaction to delete conversation + messages atomically
    // Prevents orphaned messages if something fails mid-delete
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Delete messages first (though cascade would handle this, explicit for clarity)
      await client.query("DELETE FROM messages WHERE conversation_id = $1", [id]);
      // Then delete conversation
      await client.query("DELETE FROM conversations WHERE id = $1", [id]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getMessagesByConversation(conversationId: number, maxCount?: number) {
    const queryLimit = maxCount ? Math.min(maxCount, 100) : 100;
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(queryLimit);
  },

  async createMessage(conversationId: number, role: string, content: string) {
    // Validate role to prevent injection of invalid values
    const validRoles = ["user", "assistant", "system"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`);
    }
    
    const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return message;
  },
};

