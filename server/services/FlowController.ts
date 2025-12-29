import { ClaudeService } from "./ClaudeService";
import { db } from "../db";
import { aiFlowSessions, type AiFlowSession } from "@shared/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface FlowStep {
  key: string;
  question: string;
  options?: string[];
  type: "text" | "select" | "multiselect" | "number";
  required?: boolean;
  validation?: (answer: string) => boolean;
  hint?: string;
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: FlowStep[];
  systemPrompt: string;
  generateResponse: (answers: Record<string, string>) => Promise<string>;
}

const FLOWS: Record<string, Flow> = {
  find_processor: {
    id: "find_processor",
    name: "Find a Processor",
    description: "Get recommendations for payment processors based on your merchant's needs",
    icon: "🔍",
    steps: [
      {
        key: "business_type",
        question: "What type of business is this merchant?",
        options: ["Retail", "E-commerce", "Restaurant/Food Service", "Professional Services", "Healthcare", "B2B", "High-Risk", "Other"],
        type: "select",
        required: true
      },
      {
        key: "monthly_volume",
        question: "What's their estimated monthly processing volume?",
        options: ["Under $10,000", "$10,000 - $50,000", "$50,000 - $100,000", "$100,000 - $500,000", "Over $500,000"],
        type: "select",
        required: true
      },
      {
        key: "average_ticket",
        question: "What's their average transaction amount?",
        options: ["Under $25", "$25 - $75", "$75 - $150", "$150 - $500", "Over $500"],
        type: "select",
        required: true
      },
      {
        key: "current_pain_points",
        question: "What problems are they experiencing with their current processor (if any)?",
        type: "text",
        hint: "e.g., high fees, poor customer service, integration issues, slow deposits"
      },
      {
        key: "special_requirements",
        question: "Any special requirements?",
        options: ["Same-day funding", "Multi-location support", "Integrated POS", "Mobile payments", "Recurring billing", "None"],
        type: "multiselect"
      }
    ],
    systemPrompt: `You are an expert payment processing consultant. Based on the merchant information provided, recommend the best payment processors from this list: Payment Advisors, Clearent, Global Payments TSYS, Merchant Lynx, Micamp Solutions, First Data, and Shift4. 

Consider:
- Industry expertise and vertical-specific solutions
- Pricing transparency and competitiveness
- Integration capabilities
- Customer service reputation
- Funding speed
- Contract terms

Provide 2-3 specific recommendations with clear reasoning.`,
    generateResponse: async (answers) => {
      const prompt = `A merchant needs a payment processor recommendation:
- Business Type: ${answers.business_type}
- Monthly Volume: ${answers.monthly_volume}
- Average Ticket: ${answers.average_ticket}
- Current Pain Points: ${answers.current_pain_points || "None specified"}
- Special Requirements: ${answers.special_requirements || "None"}

Based on my expertise, provide 2-3 specific processor recommendations with clear reasoning for each.`;
      
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: FLOWS.find_processor.systemPrompt,
        messages: [{ role: "user", content: prompt }]
      });
      
      return (response.content[0] as any).text;
    }
  },

  general_merchant: {
    id: "general_merchant",
    name: "General Merchant Questions",
    description: "Help answer common merchant questions about payments and processing",
    icon: "💳",
    steps: [
      {
        key: "question_category",
        question: "What category does their question fall into?",
        options: ["Pricing & Fees", "Chargebacks & Disputes", "Equipment & Integration", "Compliance & PCI", "Deposits & Funding", "Account Issues", "Other"],
        type: "select",
        required: true
      },
      {
        key: "merchant_type",
        question: "What type of merchant are they?",
        options: ["New merchant", "Existing client", "Prospect", "Unknown"],
        type: "select"
      },
      {
        key: "question_details",
        question: "What's their specific question or concern?",
        type: "text",
        required: true,
        hint: "Provide as much detail as possible about their situation"
      }
    ],
    systemPrompt: `You are a helpful payment processing support specialist. Provide clear, accurate answers to merchant questions about payment processing. Be professional but friendly, and always prioritize the merchant's understanding.

Key guidelines:
- Explain complex concepts in simple terms
- Provide specific action steps when applicable
- If the question requires escalation or documentation, mention that
- Always be honest about limitations or when you need more information`,
    generateResponse: async (answers) => {
      const prompt = `A ${answers.merchant_type || "merchant"} has a question about ${answers.question_category}:

"${answers.question_details}"

Please provide a helpful, clear response.`;
      
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: FLOWS.general_merchant.systemPrompt,
        messages: [{ role: "user", content: prompt }]
      });
      
      return (response.content[0] as any).text;
    }
  },

  create_proposal: {
    id: "create_proposal",
    name: "Create Proposal",
    description: "Generate a professional merchant services proposal",
    icon: "📝",
    steps: [
      {
        key: "business_name",
        question: "What's the business name?",
        type: "text",
        required: true
      },
      {
        key: "contact_name",
        question: "Who's the primary contact?",
        type: "text",
        required: true
      },
      {
        key: "business_type",
        question: "What type of business?",
        options: ["Retail", "E-commerce", "Restaurant", "Professional Services", "Healthcare", "B2B", "Other"],
        type: "select",
        required: true
      },
      {
        key: "monthly_volume",
        question: "Estimated monthly processing volume?",
        type: "text",
        required: true,
        hint: "e.g., $25,000"
      },
      {
        key: "current_processor",
        question: "Who is their current processor (if any)?",
        type: "text"
      },
      {
        key: "current_rates",
        question: "What are their current rates (if known)?",
        type: "text",
        hint: "e.g., 2.9% + $0.30 per transaction"
      },
      {
        key: "proposed_rates",
        question: "What rates would you like to propose?",
        type: "text",
        required: true,
        hint: "e.g., Interchange+ 0.50% + $0.10"
      },
      {
        key: "key_benefits",
        question: "What key benefits should we highlight?",
        options: ["Cost savings", "Better customer service", "Faster funding", "Modern equipment", "Integration capabilities", "Transparency"],
        type: "multiselect"
      }
    ],
    systemPrompt: `You are a professional proposal writer for merchant services. Create compelling, professional proposals that highlight value and build trust. 

Format the proposal with clear sections:
1. Executive Summary
2. Understanding Your Business
3. Our Solution
4. Pricing Comparison
5. Why Choose Us
6. Next Steps

Use professional language but keep it readable and persuasive.`,
    generateResponse: async (answers) => {
      const prompt = `Create a professional merchant services proposal with these details:

**Business Information:**
- Business Name: ${answers.business_name}
- Contact: ${answers.contact_name}
- Business Type: ${answers.business_type}
- Monthly Volume: ${answers.monthly_volume}
- Current Processor: ${answers.current_processor || "Not provided"}
- Current Rates: ${answers.current_rates || "Not provided"}

**Our Offer:**
- Proposed Rates: ${answers.proposed_rates}
- Key Benefits: ${answers.key_benefits || "Not specified"}

Generate a professional, compelling proposal that we can present to this merchant.`;
      
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: FLOWS.create_proposal.systemPrompt,
        messages: [{ role: "user", content: prompt }]
      });
      
      return (response.content[0] as any).text;
    }
  },

  rep_marketing: {
    id: "rep_marketing",
    name: "Rep Marketing",
    description: "Generate marketing content for sales reps",
    icon: "📣",
    steps: [
      {
        key: "content_type",
        question: "What type of marketing content do you need?",
        options: ["Email template", "Social media post", "Cold call script", "Flyer content", "LinkedIn message", "SMS/Text message"],
        type: "select",
        required: true
      },
      {
        key: "target_audience",
        question: "Who is your target audience?",
        options: ["New business owners", "Established merchants", "High-volume businesses", "E-commerce/Online", "Restaurants", "Retail stores", "Professional services"],
        type: "select",
        required: true
      },
      {
        key: "main_value_prop",
        question: "What's your main value proposition?",
        options: ["Lower rates", "Better service", "Faster deposits", "Modern technology", "No contracts", "Full transparency"],
        type: "select",
        required: true
      },
      {
        key: "tone",
        question: "What tone should the content have?",
        options: ["Professional & formal", "Friendly & approachable", "Urgent & action-oriented", "Educational & informative"],
        type: "select"
      },
      {
        key: "additional_context",
        question: "Any additional context or specific offers to include?",
        type: "text",
        hint: "e.g., limited-time offer, free equipment, waived setup fees"
      }
    ],
    systemPrompt: `You are an expert marketing copywriter for the merchant services industry. Create compelling, professional marketing content that drives engagement and generates leads.

Guidelines:
- Keep content concise and impactful
- Include clear calls to action
- Avoid jargon unless appropriate for the audience
- Highlight benefits over features
- Create urgency where appropriate
- Maintain compliance with industry regulations`,
    generateResponse: async (answers) => {
      const prompt = `Create ${answers.content_type} for a merchant services sales rep:

**Target Audience:** ${answers.target_audience}
**Main Value Proposition:** ${answers.main_value_prop}
**Desired Tone:** ${answers.tone || "Professional & approachable"}
**Additional Context:** ${answers.additional_context || "None"}

Generate effective ${answers.content_type} content that will help generate leads and conversions.`;
      
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: FLOWS.rep_marketing.systemPrompt,
        messages: [{ role: "user", content: prompt }]
      });
      
      return (response.content[0] as any).text;
    }
  }
};

export class FlowController {
  /**
   * Get all available flows
   */
  static getFlows(): { id: string; name: string; description: string; icon: string }[] {
    return Object.values(FLOWS).map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      icon: f.icon
    }));
  }

  /**
   * Get a specific flow by ID
   */
  static getFlow(flowId: string): Flow | null {
    return FLOWS[flowId] || null;
  }

  /**
   * Start a new flow session
   */
  static async startFlow(chatId: number, flowId: string): Promise<{ flow: Flow; session: AiFlowSession; currentStep: FlowStep } | null> {
    const flow = this.getFlow(flowId);
    if (!flow) return null;

    const session = await ClaudeService.upsertFlowSession(chatId, flowId, {
      activeStepIndex: 0,
      answeredKeys: {},
      status: "question",
      conversationHistory: []
    });

    return {
      flow,
      session,
      currentStep: flow.steps[0]
    };
  }

  /**
   * Process an answer and advance the flow
   */
  static async processAnswer(
    chatId: number,
    flowId: string,
    answer: string
  ): Promise<{
    isComplete: boolean;
    nextStep?: FlowStep;
    response?: string;
    session: AiFlowSession;
  }> {
    const flow = this.getFlow(flowId);
    if (!flow) throw new Error("Flow not found");

    const session = await ClaudeService.getFlowSession(chatId, flowId);
    if (!session) throw new Error("Flow session not found");

    const currentStep = flow.steps[session.activeStepIndex || 0];
    
    // Validate answer if validation function exists
    if (currentStep.validation && !currentStep.validation(answer)) {
      return {
        isComplete: false,
        nextStep: currentStep,
        session,
        response: `Please provide a valid answer for: ${currentStep.question}`
      };
    }

    // Update answered keys
    const answeredKeys = (session.answeredKeys || {}) as Record<string, string>;
    answeredKeys[currentStep.key] = answer;

    // Update conversation history
    const history = (session.conversationHistory || []) as any[];
    history.push({
      question: currentStep.question,
      answer,
      timestamp: new Date().toISOString()
    });

    const nextStepIndex = (session.activeStepIndex || 0) + 1;
    const isComplete = nextStepIndex >= flow.steps.length;

    if (isComplete) {
      // Generate final response
      const response = await flow.generateResponse(answeredKeys);
      
      await ClaudeService.upsertFlowSession(chatId, flowId, {
        activeStepIndex: nextStepIndex,
        answeredKeys,
        status: "complete",
        conversationHistory: history
      });

      const updatedSession = await ClaudeService.getFlowSession(chatId, flowId);
      
      return {
        isComplete: true,
        response,
        session: updatedSession!
      };
    }

    // Move to next step
    await ClaudeService.upsertFlowSession(chatId, flowId, {
      activeStepIndex: nextStepIndex,
      answeredKeys,
      status: "question",
      conversationHistory: history
    });

    const updatedSession = await ClaudeService.getFlowSession(chatId, flowId);
    
    return {
      isComplete: false,
      nextStep: flow.steps[nextStepIndex],
      session: updatedSession!
    };
  }

  /**
   * Get the current state of a flow
   */
  static async getFlowState(chatId: number, flowId: string): Promise<{
    flow: Flow;
    session: AiFlowSession | null;
    currentStep: FlowStep | null;
    progress: number;
  } | null> {
    const flow = this.getFlow(flowId);
    if (!flow) return null;

    const session = await ClaudeService.getFlowSession(chatId, flowId);
    
    if (!session) {
      return {
        flow,
        session: null,
        currentStep: null,
        progress: 0
      };
    }

    const currentStepIndex = session.activeStepIndex || 0;
    const isComplete = currentStepIndex >= flow.steps.length;

    return {
      flow,
      session,
      currentStep: isComplete ? null : flow.steps[currentStepIndex],
      progress: Math.round((currentStepIndex / flow.steps.length) * 100)
    };
  }

  /**
   * Reset a flow session
   */
  static async resetFlow(chatId: number, flowId: string): Promise<AiFlowSession | null> {
    const session = await ClaudeService.getFlowSession(chatId, flowId);
    if (!session) return null;

    await db.update(aiFlowSessions)
      .set({
        activeStepIndex: 0,
        answeredKeys: {},
        status: "question",
        followUpDepth: 0,
        conversationHistory: [],
        updatedAt: new Date()
      })
      .where(eq(aiFlowSessions.id, session.id));

    return await ClaudeService.getFlowSession(chatId, flowId);
  }

  /**
   * Ask a follow-up question within a completed flow
   */
  static async askFollowUp(
    chatId: number,
    flowId: string,
    question: string
  ): Promise<string> {
    const flow = this.getFlow(flowId);
    if (!flow) throw new Error("Flow not found");

    const session = await ClaudeService.getFlowSession(chatId, flowId);
    if (!session || session.status !== "complete") {
      throw new Error("Flow must be completed before asking follow-up questions");
    }

    const answeredKeys = session.answeredKeys as Record<string, string>;
    
    // Build context from previous answers
    const context = Object.entries(answeredKeys)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: flow.systemPrompt + "\n\nPrevious conversation context:\n" + context,
      messages: [{ role: "user", content: question }]
    });

    // Update follow-up depth
    await ClaudeService.upsertFlowSession(chatId, flowId, {
      status: "followup",
      followUpDepth: (session.followUpDepth || 0) + 1
    });

    return (response.content[0] as any).text;
  }
}
