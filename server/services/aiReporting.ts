import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface ReportQuery {
  query: string;
  filters?: {
    month?: string;
    processors?: string[];
    agents?: string[];
    partners?: string[];
    minRevenue?: number;
    maxRevenue?: number;
  };
}

export interface ReportSpec {
  title: string;
  description: string;
  type: 'table' | 'chart' | 'summary';
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  metrics: string[];
  groupBy: string[];
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AIReportingService {
  static async parseNaturalLanguageQuery(query: string): Promise<ReportSpec> {
    try {
      const prompt = `
        You are an AI assistant for a merchant services residual tracking system. 
        Parse the following natural language query into a structured report specification.
        
        Available data fields:
        - Merchants: mid, legalName, dba, status, currentProcessor, partnerName
        - Monthly Data: month, transactions, salesAmount, income, expenses, net, bps, percentage
        - Roles: name, type (association, partner, agent, sales_manager, company)
        - Assignments: percentage splits by role
        - Processors: Payment Advisors, Clearent, Micamp Solutions, Global Payments TSYS, etc.
        
        Available report types: table, chart, summary
        Available chart types: bar, line, pie, area
        
        Query: "${query}"
        
        Respond with JSON in this exact format:
        {
          "title": "Report Title",
          "description": "Brief description of what the report shows",
          "type": "table|chart|summary",
          "chartType": "bar|line|pie|area (only if type is chart)",
          "metrics": ["array of metrics to calculate/display"],
          "groupBy": ["array of fields to group by"],
          "filters": {"field": "value"},
          "sortBy": "field to sort by",
          "sortOrder": "asc|desc"
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a data analysis expert specializing in merchant services reporting. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Validate and set defaults
      return {
        title: result.title || "Custom Report",
        description: result.description || "Generated report",
        type: result.type || "table",
        chartType: result.chartType,
        metrics: Array.isArray(result.metrics) ? result.metrics : ["net"],
        groupBy: Array.isArray(result.groupBy) ? result.groupBy : [],
        filters: result.filters || {},
        sortBy: result.sortBy,
        sortOrder: result.sortOrder || "desc",
      };
    } catch (error) {
      throw new Error(`Failed to parse query: ${error.message}`);
    }
  }

  static async generateInsights(data: any[], reportSpec: ReportSpec): Promise<string> {
    try {
      const prompt = `
        Analyze the following merchant services data and provide business insights.
        
        Report Specification:
        ${JSON.stringify(reportSpec, null, 2)}
        
        Data Summary:
        - Total records: ${data.length}
        - Sample data: ${JSON.stringify(data.slice(0, 5), null, 2)}
        
        Provide 3-5 key insights focusing on:
        1. Revenue trends and patterns
        2. Top performers and opportunities
        3. Risk factors or issues to address
        4. Actionable recommendations
        
        Keep insights concise and business-focused.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a merchant services business analyst. Provide clear, actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
      });

      return response.choices[0].message.content || "No insights generated.";
    } catch (error) {
      console.error("Failed to generate insights:", error);
      return "Insights generation temporarily unavailable.";
    }
  }

  static async suggestReportQueries(): Promise<string[]> {
    return [
      "Show me revenue by agent for May 2025",
      "Generate a split analysis report for Clearent processor",
      "Top 10 merchants by net revenue this month",
      "Commission breakdown by partner organization",
      "Monthly revenue trends for Q2 2025",
      "Merchants with split percentage errors",
      "Agent performance comparison across all processors",
      "Revenue distribution by processor type",
      "Inactive merchants that still have revenue",
      "Partnership ROI analysis for May 2025"
    ];
  }

  static async generateEmailContent(reportData: any, reportSpec: ReportSpec): Promise<{
    subject: string;
    htmlContent: string;
    textContent: string;
  }> {
    try {
      const prompt = `
        Generate professional email content for a merchant services residual report.
        
        Report: ${reportSpec.title}
        Description: ${reportSpec.description}
        
        Data highlights:
        ${JSON.stringify(reportData.summary || {}, null, 2)}
        
        Create:
        1. Professional email subject line
        2. HTML email body with executive summary and key metrics
        3. Plain text version
        
        Response format:
        {
          "subject": "Email subject line",
          "htmlContent": "HTML email body",
          "textContent": "Plain text version"
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional business communications specialist."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      throw new Error(`Failed to generate email content: ${error.message}`);
    }
  }
}
