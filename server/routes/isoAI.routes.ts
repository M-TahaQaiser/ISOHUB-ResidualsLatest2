import { Router, Request, Response } from "express";
import { z } from "zod";
import { ClaudeService } from "../services/ClaudeService";
import { FlowController } from "../services/FlowController";
import { db } from "../db";
import { 
  aiChats, 
  aiMessages, 
  aiChatFolders, 
  aiChatFolderAssignments,
  aiMessageFeedback,
  aiUserPreferences,
  type AiChat,
  type AiChatFolder,
  insertAiChatFolderSchema,
  insertAiMessageFeedbackSchema
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { authenticateToken, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Apply authentication to all ISO-AI routes
router.use(authenticateToken);

const sendMessageSchema = z.object({
  chatId: z.number().optional(),
  message: z.string().min(1, "Message is required"),
  images: z.array(z.object({
    type: z.string(),
    data: z.string()
  })).optional()
});

const updateChatSchema = z.object({
  title: z.string().min(1).max(500)
});

const createFolderSchema = z.object({
  name: z.string().min(1).max(100)
});

const moveChatToFolderSchema = z.object({
  folderId: z.number().nullable()
});

const flowAnswerSchema = z.object({
  flowId: z.string(),
  answer: z.string()
});

const feedbackSchema = z.object({
  rating: z.enum(["helpful", "not_helpful"]),
  comment: z.string().optional()
});

const preferencesSchema = z.object({
  voiceEnabled: z.boolean().optional(),
  selectedVoice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional(),
  darkMode: z.boolean().optional(),
  soundEffects: z.boolean().optional(),
  autoExpandChats: z.boolean().optional(),
  keyboardShortcutsEnabled: z.boolean().optional()
});

function getUserId(req: AuthenticatedRequest): number {
  if (!req.user?.id) {
    throw new Error("User not authenticated");
  }
  return req.user.id;
}

function getOrganizationId(req: AuthenticatedRequest): string {
  // Use agency ID as organization ID if available, otherwise default
  return req.user?.agencyId ? `org-${req.user.agencyId}` : "org-86f76df1";
}

router.post("/chats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    const { title } = req.body;

    const chat = await ClaudeService.createChat(userId, organizationId, title);
    res.status(201).json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
});

router.get("/chats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);

    const chats = await ClaudeService.getUserChats(userId, organizationId);
    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

router.get("/chats/:chatId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.chatId);
    const [chat] = await db.select().from(aiChats).where(eq(aiChats.id, chatId));
    
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const messages = await ClaudeService.getChatMessages(chatId);
    res.json({ chat, messages });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

router.patch("/chats/:chatId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.chatId);
    const { title } = updateChatSchema.parse(req.body);

    const chat = await ClaudeService.updateChatTitle(chatId, title);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json(chat);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating chat:", error);
    res.status(500).json({ error: "Failed to update chat" });
  }
});

router.delete("/chats/:chatId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.chatId);
    const userId = getUserId(req);
    const { reason } = req.body;

    const success = await ClaudeService.deleteChat(chatId, userId, reason);
    if (!success) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

router.post("/messages", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    const { chatId: providedChatId, message, images } = sendMessageSchema.parse(req.body);

    let chatId = providedChatId;
    if (!chatId) {
      const chat = await ClaudeService.createChat(userId, organizationId);
      chatId = chat.id;
    }

    const result = await ClaudeService.sendMessage(chatId, message, images, organizationId);
    
    res.json({
      chatId,
      content: result.content,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post("/messages/stream", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    const { chatId: providedChatId, message, images } = sendMessageSchema.parse(req.body);

    let chatId = providedChatId;
    if (!chatId) {
      const chat = await ClaudeService.createChat(userId, organizationId);
      chatId = chat.id;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Chat-Id", chatId.toString());

    for await (const chunk of ClaudeService.streamMessage(chatId, message, images, organizationId)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error streaming message:", error);
    res.write(`data: ${JSON.stringify({ type: "error", error: "Streaming failed" })}\n\n`);
    res.end();
  }
});

router.post("/messages/stream-with-tools", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    const agencyId = req.user?.agencyId;
    const { chatId: providedChatId, message, images } = sendMessageSchema.parse(req.body);

    let chatId = providedChatId;
    if (!chatId) {
      const chat = await ClaudeService.createChat(userId, organizationId);
      chatId = chat.id;
    }

    const toolContext = {
      organizationId,
      agencyId,
      userId,
      chatId
    };

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Chat-Id", chatId.toString());

    for await (const chunk of ClaudeService.streamMessageWithTools(chatId, message, toolContext, images, organizationId)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error streaming message with tools:", error);
    res.write(`data: ${JSON.stringify({ type: "error", error: "Streaming failed" })}\n\n`);
    res.end();
  }
});

router.post("/messages/:messageId/feedback", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const userId = getUserId(req);
    const { rating, comment } = feedbackSchema.parse(req.body);

    const [feedback] = await db.insert(aiMessageFeedback).values({
      messageId,
      userId,
      rating,
      comment
    }).returning();

    res.status(201).json(feedback);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

router.get("/folders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    const folders = await db.select()
      .from(aiChatFolders)
      .where(eq(aiChatFolders.userId, userId))
      .orderBy(asc(aiChatFolders.position));

    res.json(folders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ error: "Failed to fetch folders" });
  }
});

router.post("/folders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    const { name } = createFolderSchema.parse(req.body);

    const existingFolders = await db.select()
      .from(aiChatFolders)
      .where(eq(aiChatFolders.userId, userId));

    if (existingFolders.length >= 20) {
      return res.status(400).json({ error: "Maximum of 20 folders allowed" });
    }

    const [folder] = await db.insert(aiChatFolders).values({
      userId,
      organizationId,
      name,
      position: existingFolders.length
    }).returning();

    res.status(201).json(folder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

router.patch("/folders/:folderId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folderId = parseInt(req.params.folderId);
    const { name } = createFolderSchema.parse(req.body);

    const [folder] = await db.update(aiChatFolders)
      .set({ name, updatedAt: new Date() })
      .where(eq(aiChatFolders.id, folderId))
      .returning();

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.json(folder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating folder:", error);
    res.status(500).json({ error: "Failed to update folder" });
  }
});

router.delete("/folders/:folderId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folderId = parseInt(req.params.folderId);

    await db.delete(aiChatFolderAssignments)
      .where(eq(aiChatFolderAssignments.folderId, folderId));

    const [deleted] = await db.delete(aiChatFolders)
      .where(eq(aiChatFolders.id, folderId))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
});

router.post("/chats/:chatId/folder", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.chatId);
    const { folderId } = moveChatToFolderSchema.parse(req.body);

    await db.delete(aiChatFolderAssignments)
      .where(eq(aiChatFolderAssignments.chatId, chatId));

    if (folderId !== null) {
      await db.insert(aiChatFolderAssignments).values({
        folderId,
        chatId
      });
    }

    await db.update(aiChats)
      .set({ folderId, updatedAt: new Date() })
      .where(eq(aiChats.id, chatId));

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error moving chat to folder:", error);
    res.status(500).json({ error: "Failed to move chat" });
  }
});

router.get("/flows", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const flows = FlowController.getFlows();
    res.json(flows);
  } catch (error) {
    console.error("Error fetching flows:", error);
    res.status(500).json({ error: "Failed to fetch flows" });
  }
});

router.get("/flows/:flowId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { flowId } = req.params;
    const flow = FlowController.getFlow(flowId);
    
    if (!flow) {
      return res.status(404).json({ error: "Flow not found" });
    }

    res.json({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      icon: flow.icon,
      steps: flow.steps
    });
  } catch (error) {
    console.error("Error fetching flow:", error);
    res.status(500).json({ error: "Failed to fetch flow" });
  }
});

router.post("/flows/:flowId/start", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { flowId } = req.params;
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    const result = await FlowController.startFlow(chatId, flowId);
    
    if (!result) {
      return res.status(404).json({ error: "Flow not found" });
    }

    res.json({
      flow: {
        id: result.flow.id,
        name: result.flow.name,
        description: result.flow.description
      },
      session: result.session,
      currentStep: result.currentStep
    });
  } catch (error) {
    console.error("Error starting flow:", error);
    res.status(500).json({ error: "Failed to start flow" });
  }
});

router.post("/flows/:flowId/answer", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { flowId } = req.params;
    const { chatId, answer } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    const result = await FlowController.processAnswer(chatId, flowId, answer);
    res.json(result);
  } catch (error) {
    console.error("Error processing answer:", error);
    res.status(500).json({ error: "Failed to process answer" });
  }
});

router.get("/flows/:flowId/state", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { flowId } = req.params;
    const chatId = parseInt(req.query.chatId as string);

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    const state = await FlowController.getFlowState(chatId, flowId);
    
    if (!state) {
      return res.status(404).json({ error: "Flow not found" });
    }

    res.json({
      flow: {
        id: state.flow.id,
        name: state.flow.name,
        description: state.flow.description
      },
      session: state.session,
      currentStep: state.currentStep,
      progress: state.progress
    });
  } catch (error) {
    console.error("Error fetching flow state:", error);
    res.status(500).json({ error: "Failed to fetch flow state" });
  }
});

router.post("/flows/:flowId/reset", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { flowId } = req.params;
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    const session = await FlowController.resetFlow(chatId, flowId);
    res.json({ success: true, session });
  } catch (error) {
    console.error("Error resetting flow:", error);
    res.status(500).json({ error: "Failed to reset flow" });
  }
});

router.post("/flows/:flowId/followup", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { flowId } = req.params;
    const { chatId, question } = req.body;

    if (!chatId || !question) {
      return res.status(400).json({ error: "chatId and question are required" });
    }

    const response = await FlowController.askFollowUp(chatId, flowId, question);
    res.json({ response });
  } catch (error) {
    console.error("Error asking follow-up:", error);
    res.status(500).json({ error: "Failed to process follow-up question" });
  }
});

router.get("/preferences", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    const [preferences] = await db.select()
      .from(aiUserPreferences)
      .where(eq(aiUserPreferences.userId, userId));

    if (!preferences) {
      return res.json({
        voiceEnabled: false,
        selectedVoice: "nova",
        darkMode: true,
        soundEffects: true,
        autoExpandChats: true,
        keyboardShortcutsEnabled: true
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.patch("/preferences", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const updates = preferencesSchema.parse(req.body);

    const [existing] = await db.select()
      .from(aiUserPreferences)
      .where(eq(aiUserPreferences.userId, userId));

    if (existing) {
      const [updated] = await db.update(aiUserPreferences)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(aiUserPreferences.userId, userId))
        .returning();
      return res.json(updated);
    }

    const [created] = await db.insert(aiUserPreferences).values({
      userId,
      ...updates
    }).returning();

    res.json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

router.post("/analyze-image", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image, imageType, prompt } = req.body;

    if (!image || !imageType) {
      return res.status(400).json({ error: "Image and imageType are required" });
    }

    const analysis = await ClaudeService.analyzeImage(image, imageType, prompt);
    res.json({ analysis });
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

export default router;
