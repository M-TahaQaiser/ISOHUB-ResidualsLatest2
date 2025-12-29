import { db } from '../../db';
import { aiDocumentAnalysis } from '../../../shared/schema';
import { aiOrchestrationService } from './AIOrchestrationService';
import { eq } from 'drizzle-orm';

interface DocumentMetadata {
  documentId: string;
  documentName: string;
  documentType: string;
  fileSize: number;
  mimeType?: string;
}

interface AnalysisResult {
  merchants?: {
    mid: string;
    name: string;
    dba?: string;
    address?: string;
  }[];
  transactions?: {
    date: string;
    amount: number;
    type: string;
    merchant?: string;
  }[];
  financials?: {
    totalRevenue?: number;
    totalExpenses?: number;
    netIncome?: number;
    period?: string;
  };
  commissions?: {
    agentName?: string;
    rate?: number;
    amount?: number;
    period?: string;
  }[];
  processorInfo?: {
    name?: string;
    accountNumber?: string;
    batchInfo?: string;
  };
  extractedText?: string;
  confidence?: number;
  metadata?: any;
}

export class DocumentAnalysisService {
  
  // Analyze document content based on type
  async analyzeDocument(
    content: string | Buffer,
    metadata: DocumentMetadata,
    organizationId: string
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Convert Buffer to string if needed
      const textContent = Buffer.isBuffer(content) 
        ? content.toString('utf-8') 
        : content;
      
      // Determine document type for specialized processing
      const docType = this.detectDocumentType(metadata.documentName, metadata.mimeType);
      
      // Create specialized prompt based on document type
      const analysisPrompt = this.createAnalysisPrompt(docType, metadata.documentName);
      
      // Analyze with Claude 4 Sonnet
      const analysis = await aiOrchestrationService.analyzeDocument(
        textContent,
        docType,
        organizationId
      );
      
      // Post-process analysis results
      const processedResult = this.postProcessAnalysis(analysis, docType);
      
      // Store analysis in database
      await this.storeAnalysis(
        metadata,
        processedResult,
        organizationId,
        Date.now() - startTime
      );
      
      return processedResult;
    } catch (error) {
      console.error('Document analysis error:', error);
      
      // Store failed analysis
      await this.storeAnalysis(
        metadata,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        organizationId,
        Date.now() - startTime,
        'failed'
      );
      
      throw error;
    }
  }
  
  // Detect document type from filename and mime type
  private detectDocumentType(filename: string, mimeType?: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    // Check by mime type first
    if (mimeType) {
      if (mimeType.includes('pdf')) return 'pdf';
      if (mimeType.includes('csv')) return 'csv';
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'xlsx';
      if (mimeType.includes('image')) return 'image';
      if (mimeType.includes('text')) return 'text';
    }
    
    // Check by extension
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'csv':
        return 'csv';
      case 'xlsx':
      case 'xls':
        return 'xlsx';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'image';
      case 'txt':
      case 'log':
        return 'text';
      default:
        return 'unknown';
    }
  }
  
  // Create specialized analysis prompt
  private createAnalysisPrompt(docType: string, filename: string): string {
    const basePrompt = `Analyze this ${docType} document (${filename}) for merchant services data.`;
    
    switch (docType) {
      case 'csv':
        return `${basePrompt}
Extract:
1. All merchant records (MID, name, DBA)
2. Transaction data and volumes
3. Commission/residual information
4. Processing rates and fees
5. Date ranges and reporting periods
Identify the processor and format used.`;
      
      case 'pdf':
        return `${basePrompt}
Extract:
1. Merchant account information
2. Financial summaries
3. Processing statements
4. Commission structures
5. Contract terms
6. Important dates and deadlines
Identify document type (statement, contract, report, etc.).`;
      
      case 'xlsx':
        return `${basePrompt}
Extract:
1. All data tables and their headers
2. Merchant listings
3. Financial calculations
4. Commission breakdowns
5. Summary totals
Identify spreadsheet structure and key metrics.`;
      
      case 'image':
        return `${basePrompt}
Extract any visible text, especially:
1. Merchant information
2. Account numbers
3. Financial data
4. Signatures or stamps
5. Document metadata
Describe the image content and quality.`;
      
      default:
        return `${basePrompt}
Extract all relevant merchant services information including accounts, transactions, commissions, and financial data.`;
    }
  }
  
  // Post-process analysis results
  private postProcessAnalysis(rawAnalysis: any, docType: string): AnalysisResult {
    // If already structured, return as-is
    if (rawAnalysis && typeof rawAnalysis === 'object' && !rawAnalysis.rawAnalysis) {
      return rawAnalysis as AnalysisResult;
    }
    
    // Try to extract structured data from raw analysis
    const result: AnalysisResult = {
      extractedText: rawAnalysis.rawAnalysis || JSON.stringify(rawAnalysis),
      confidence: 0.85,
      metadata: {
        documentType: docType,
        processedAt: new Date().toISOString(),
      },
    };
    
    // Attempt to parse merchants
    if (rawAnalysis.merchants || rawAnalysis.merchant_records) {
      result.merchants = rawAnalysis.merchants || rawAnalysis.merchant_records;
    }
    
    // Attempt to parse financials
    if (rawAnalysis.financials || rawAnalysis.financial_data) {
      result.financials = rawAnalysis.financials || rawAnalysis.financial_data;
    }
    
    // Attempt to parse commissions
    if (rawAnalysis.commissions || rawAnalysis.commission_data) {
      result.commissions = rawAnalysis.commissions || rawAnalysis.commission_data;
    }
    
    return result;
  }
  
  // Store analysis in database
  private async storeAnalysis(
    metadata: DocumentMetadata,
    result: any,
    organizationId: string,
    processingTime: number,
    status: string = 'completed'
  ) {
    try {
      await db.insert(aiDocumentAnalysis).values({
        organizationId,
        documentId: metadata.documentId,
        documentName: metadata.documentName,
        documentType: metadata.documentType,
        fileSize: metadata.fileSize,
        analysisResult: result,
        modelUsed: 'claude-3-5-sonnet-20241022',
        processingTime,
        extractedEntities: result.merchants || result.transactions || {},
        confidenceScore: result.confidence?.toString() || '0.85',
        status,
        errorMessage: result.error || null,
        metadata: {
          mimeType: metadata.mimeType,
          analyzedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error storing document analysis:', error);
    }
  }
  
  // Get analysis history for an organization
  async getAnalysisHistory(organizationId: string, limit: number = 10) {
    return await db
      .select()
      .from(aiDocumentAnalysis)
      .where(eq(aiDocumentAnalysis.organizationId, organizationId))
      .orderBy(aiDocumentAnalysis.createdAt)
      .limit(limit);
  }
  
  // Re-analyze a document
  async reanalyzeDocument(documentId: string, organizationId: string) {
    const [existingAnalysis] = await db
      .select()
      .from(aiDocumentAnalysis)
      .where(
        eq(aiDocumentAnalysis.documentId, documentId)
      )
      .limit(1);
    
    if (!existingAnalysis) {
      throw new Error('Document analysis not found');
    }
    
    // Mark existing as reprocessing
    await db
      .update(aiDocumentAnalysis)
      .set({ status: 'reprocessing' })
      .where(eq(aiDocumentAnalysis.id, existingAnalysis.id));
    
    // Note: Would need to retrieve original document content
    // This is a placeholder - in real implementation, document content
    // would be stored or retrievable from a document storage service
    
    return {
      message: 'Document queued for reanalysis',
      documentId,
    };
  }
  
  // Extract specific entities from analysis
  extractEntities(analysis: AnalysisResult): {
    merchants: string[];
    amounts: number[];
    dates: string[];
    processors: string[];
  } {
    const entities = {
      merchants: [],
      amounts: [],
      dates: [],
      processors: [],
    };
    
    // Extract merchants
    if (analysis.merchants) {
      entities.merchants = analysis.merchants.map(m => m.name);
    }
    
    // Extract amounts
    if (analysis.transactions) {
      entities.amounts = analysis.transactions.map(t => t.amount);
    }
    if (analysis.financials) {
      if (analysis.financials.totalRevenue) {
        entities.amounts.push(analysis.financials.totalRevenue);
      }
    }
    
    // Extract dates
    if (analysis.transactions) {
      entities.dates = analysis.transactions.map(t => t.date);
    }
    
    // Extract processors
    if (analysis.processorInfo?.name) {
      entities.processors.push(analysis.processorInfo.name);
    }
    
    return entities;
  }
}

// Export singleton instance
export const documentAnalysisService = new DocumentAnalysisService();