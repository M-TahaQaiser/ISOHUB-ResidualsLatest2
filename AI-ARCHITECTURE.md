# ISOHub AI System - Technical Architecture

## Executive Summary

The ISOHub AI system is a multi-tenant, model-agnostic AI assistant designed for merchant services professionals. It provides intelligent chat capabilities, document analysis, and knowledge base management with sophisticated fallback mechanisms and semantic search capabilities.

**Key Technologies:**
- **Primary AI Models**: OpenAI GPT-4o (via Replit AI Integrations), GPT-4o-mini (fallback)
- **Secondary AI Models**: Anthropic Claude 3.5 Sonnet (when API key provided)
- **Database**: PostgreSQL with Drizzle ORM
- **Vector Search**: Keyword-based fallback (embeddings via OpenAI when available)
- **Authentication**: Session-based auth with multi-tenant isolation

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   AI Chat    │  │   Document   │  │  Knowledge   │      │
│  │  Component   │  │   Analysis   │  │     Base     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                 Express.js Backend                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            AI Routes (/api/ai/*)                      │   │
│  │  • /chat - Process user queries                      │   │
│  │  • /knowledge - Manage knowledge base                │   │
│  │  • /document/analyze - Analyze documents             │   │
│  │  • /training - Handle corrections                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  AI Services Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     AI       │  │    Vector    │  │    Chat      │      │
│  │ Orchestration│  │    Search    │  │  Training    │      │
│  │   Service    │  │   Service    │  │  Service     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 External AI Providers                        │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   OpenAI     │         │  Anthropic   │                 │
│  │  (Primary)   │         │  (Secondary) │                 │
│  └──────────────┘         └──────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Neon)                      │
│  • ai_chat_sessions                                         │
│  • ai_knowledge_base                                        │
│  • ai_model_configs                                         │
│  • ai_document_analysis                                     │
│  • ai_training_corrections                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. AI Orchestration Service (`server/services/ai/AIOrchestrationService.ts`)

**Purpose**: Central intelligence hub that manages multi-model AI interactions with automatic fallback mechanisms.

**Key Features:**
- **Multi-model support** with intelligent failover
- **Tenant-aware configuration** (per-organization model preferences)
- **Conversation history management**
- **Performance tracking** (tokens, response time)

**Model Prioritization Logic:**
```typescript
1. Try OpenAI GPT-4o (primary)
   ↓ (on failure)
2. Try OpenAI GPT-4o-mini (fallback)
   ↓ (on failure)
3. Try Anthropic Claude 3.5 Sonnet (secondary, if API key exists)
   ↓ (on failure)
4. Return graceful error response
```

**Configuration:**
```typescript
// Environment Variables (Replit AI Integrations)
AI_INTEGRATIONS_OPENAI_API_KEY    // OpenAI API key via Replit
AI_INTEGRATIONS_OPENAI_BASE_URL   // Optional proxy URL
ANTHROPIC_API_KEY                 // Claude API key (optional)
```

**Code Flow:**
```typescript
constructor() → initializeClients()
  ├─ Initialize OpenAI client (Replit AI Integrations)
  └─ Initialize Anthropic client (if API key exists)

processQuery(query, context, messages) → ModelResponse
  ├─ Get tenant model config from database
  ├─ Try processOpenAI('gpt-4o')
  │   └─ On error: Try processOpenAI('gpt-4o-mini')
  ├─ On OpenAI failure: Try processClaude()
  └─ Return response or error fallback
```

**System Prompt Architecture:**
```typescript
// Industry-specific context for merchant services
const systemPrompt = `
You are an AI assistant for ISO Hub, a comprehensive merchant services platform.
You help independent sales agents with:
- Payment processing (First Data, TSYS, Clearent, etc.)
- Commission structures and residual calculations
- Compliance (PCI DSS, AML/KYC, Regulation E)
- Sales techniques and competitive analysis
- Fraud prevention and chargeback management
...
`;
```

---

### 2. Vector Search Service (`server/services/ai/VectorSearchService.ts`)

**Purpose**: Provides semantic search capabilities with intelligent fallback when embeddings are unavailable.

**Search Strategy:**
1. **Primary**: OpenAI embeddings API (text-embedding-3-small)
2. **Fallback**: Keyword-based pseudo-embeddings (384-dimensional vector)

**Why Fallback Exists:**
Replit's AI Integrations proxy doesn't support the embeddings endpoint, so the system uses a deterministic keyword-based approach that still provides reasonable search results.

**Fallback Algorithm:**
```typescript
generateFallbackEmbedding(text: string): number[] {
  const keywords = text.toLowerCase().split(/\W+/);
  const vector = new Array(384).fill(0);
  
  // Hash each keyword to a position in the vector
  keywords.forEach((keyword) => {
    const hash = hashString(keyword);
    const position = hash % vector.length;
    vector[position] = 1;
  });
  
  return vector;
}
```

**Search Methods:**
- `searchKnowledgeBase()` - Direct vector similarity search
- `searchWithExpansion()` - Enhanced search with synonym expansion
- `hybridSearch()` - Combines vector + keyword search (50/50 weight)

**Cosine Similarity Calculation:**
```typescript
cosineSimilarity(vec1, vec2) = 
  dotProduct(vec1, vec2) / (||vec1|| * ||vec2||)
```

---

### 3. Chat Training Service (`server/services/ai/ChatTrainingService.ts`)

**Purpose**: Enables continuous improvement through human-in-the-loop corrections.

**Workflow:**
1. Admin identifies incorrect AI response
2. Provides corrected response + reason
3. System saves to `ai_training_corrections` table
4. Correction status tracked: `pending → processing → applied → failed`
5. Successfully applied corrections update knowledge base

**Key Methods:**
- `submitCorrection()` - Record admin corrections
- `applyCorrection()` - Update knowledge base with verified corrections
- `getPendingCorrections()` - Retrieve corrections awaiting review

---

### 4. Knowledge Base Seeder (`server/services/ai/KnowledgeBaseSeeder.ts`)

**Purpose**: Pre-populates the knowledge base with merchant services domain expertise.

**Pre-seeded Categories:**
- Commission & Residuals
- Underwriting & Risk
- Compliance & Regulations
- Payment Processing Basics
- Equipment & POS Systems
- Fraud & Chargebacks
- Sales & Competition
- Pricing & Interchange
- Technology & Integration
- Industry Trends

**Sample Entry Structure:**
```typescript
{
  category: "Commission & Residuals",
  question: "What are interchange fees?",
  answer: "Detailed explanation...",
  keywords: ["interchange", "fees", "card networks"],
  embeddings: [0.123, -0.456, ...], // 384-dim vector
  source: "seeded",
  isActive: true
}
```

**Seeding Process:**
```typescript
seedKnowledgeBase(organizationId) {
  for each FAQ entry:
    1. Generate embeddings (or fallback vector)
    2. Insert into ai_knowledge_base table
    3. Associate with organizationId
}
```

---

## API Routes (`server/routes/ai.routes.ts`)

### POST `/api/ai/chat`
**Process user queries with AI assistance**

**Request:**
```json
{
  "query": "What are interchange fees?",
  "sessionId": "uuid-or-null",
  "messages": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ]
}
```

**Flow:**
1. Extract organizationId from session
2. Search knowledge base for relevant context (top 3 results)
3. Append knowledge context to query
4. Process with AIOrchestrationService
5. Save chat session to database
6. Return response

**Response:**
```json
{
  "response": "AI-generated answer...",
  "sessionId": "uuid",
  "model": "gpt-4o",
  "tokens": 699,
  "responseTime": 3192,
  "knowledgeUsed": 3
}
```

### GET `/api/ai/knowledge/search`
**Search knowledge base with semantic similarity**

**Query Parameters:**
- `q` - Search query (required)
- `category` - Filter by category (optional)
- `limit` - Max results (default: 5)

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "question": "What are interchange fees?",
      "answer": "...",
      "category": "Pricing & Interchange",
      "score": 0.89,
      "keywords": ["interchange", "fees"]
    }
  ]
}
```

### POST `/api/ai/knowledge`
**Add new knowledge base entry**

**Request:**
```json
{
  "category": "Commission & Residuals",
  "question": "How do split commissions work?",
  "answer": "Split commissions allow...",
  "keywords": ["split", "commission", "residuals"]
}
```

### POST `/api/ai/knowledge/seed`
**Initialize knowledge base with 50 pre-defined FAQs**

### POST `/api/ai/document/analyze`
**Analyze documents using AI (PDF, CSV, Excel, images)**

**Request:** `multipart/form-data` with file

**Response:**
```json
{
  "analysis": {
    "documentType": "pdf",
    "extractedData": {...},
    "entities": ["merchants", "amounts", "dates"],
    "confidence": 0.92
  },
  "model": "claude-3-5-sonnet",
  "processingTime": 4521
}
```

---

## Database Schema

### `ai_chat_sessions`
Stores conversation history and performance metrics.

```sql
CREATE TABLE ai_chat_sessions (
  id SERIAL PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id INTEGER,  -- Nullable (no foreign key)
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  model_used TEXT,
  total_tokens INTEGER DEFAULT 0,
  response_time INTEGER,  -- milliseconds
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Why `user_id` is nullable:**
Early versions had foreign key constraint to `users.id`, but this caused errors when sessions were created before user authentication. Made nullable to support anonymous sessions.

### `ai_knowledge_base`
Stores searchable FAQ entries with embeddings.

```sql
CREATE TABLE ai_knowledge_base (
  id SERIAL PRIMARY KEY,
  organization_id TEXT NOT NULL,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[],
  embeddings JSONB,  -- 384-dim vector [0.123, -0.456, ...]
  usage_count INTEGER DEFAULT 0,
  is_corrected BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  source TEXT,  -- manual, imported, ai-generated, seeded
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kb_org_category ON ai_knowledge_base(organization_id, category);
CREATE INDEX idx_kb_search ON ai_knowledge_base(organization_id, is_active);
```

### `ai_model_configs`
Per-organization AI model preferences.

```sql
CREATE TABLE ai_model_configs (
  id SERIAL PRIMARY KEY,
  organization_id TEXT NOT NULL UNIQUE,
  primary_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  secondary_model TEXT DEFAULT 'gpt-4o-mini',
  fallback_model TEXT DEFAULT 'gpt-3.5-turbo',
  custom_prompts TEXT[],
  max_tokens INTEGER DEFAULT 4000,
  temperature DECIMAL(2,1) DEFAULT 0.7,
  doc_processing_enabled BOOLEAN DEFAULT true,
  chat_enabled BOOLEAN DEFAULT true,
  kb_enabled BOOLEAN DEFAULT true,
  monthly_token_limit INTEGER,
  current_month_usage INTEGER DEFAULT 0,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `ai_training_corrections`
Human corrections for continuous improvement.

```sql
CREATE TABLE ai_training_corrections (
  id SERIAL PRIMARY KEY,
  organization_id TEXT NOT NULL,
  chat_session_id INTEGER REFERENCES ai_chat_sessions(id),
  original_query TEXT NOT NULL,
  original_response TEXT NOT NULL,
  corrected_response TEXT NOT NULL,
  admin_id INTEGER REFERENCES users(id) NOT NULL,
  correction_reason TEXT,
  training_status TEXT DEFAULT 'pending',
  applied_to_kb BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  applied_at TIMESTAMP
);
```

### `ai_document_analysis`
Document processing results and metadata.

```sql
CREATE TABLE ai_document_analysis (
  id SERIAL PRIMARY KEY,
  organization_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT,  -- pdf, csv, xlsx, image
  file_size INTEGER,
  analysis_result JSONB NOT NULL,
  model_used TEXT DEFAULT 'claude-4-sonnet',
  processing_time INTEGER,
  extracted_entities JSONB,
  confidence_score DECIMAL(3,2),
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX idx_doc_org ON ai_document_analysis(organization_id, status);
```

---

## Multi-Tenancy & Security

### Tenant Isolation
Every AI operation is scoped to an `organizationId`:

```typescript
interface TenantContext {
  organizationId: string;  // Isolates all data
  userId?: number;         // Optional user tracking
  sessionId: string;       // Conversation tracking
  customPrompts?: string[]; // Tenant-specific instructions
}
```

### Authentication Flow
```typescript
// All AI routes protected by session-based auth
router.post('/chat', authMiddleware, async (req: AuthRequest, res) => {
  const organizationId = req.user?.organizationId || 'org-86f76df1';
  const userId = req.user?.id;
  
  // All queries scoped to tenant
  const results = await vectorSearchService.searchKnowledgeBase(
    query,
    organizationId,  // ← Tenant isolation
    limit
  );
});
```

### Data Access Control
```typescript
// Knowledge base queries always filtered by org
const entries = await db
  .select()
  .from(aiKnowledgeBase)
  .where(and(
    eq(aiKnowledgeBase.organizationId, organizationId),  // ← Isolation
    eq(aiKnowledgeBase.isActive, true)
  ));
```

---

## Error Handling & Resilience

### Cascading Fallback Strategy

**Level 1: Primary Model (GPT-4o)**
```typescript
try {
  return await this.processOpenAI(query, messages, config, startTime, 'gpt-4o');
} catch (error) {
  console.error('GPT-4o failed:', error);
  // Continue to Level 2
}
```

**Level 2: Fallback Model (GPT-4o-mini)**
```typescript
try {
  return await this.processOpenAI(query, messages, config, startTime, 'gpt-4o-mini');
} catch (error) {
  console.error('GPT-4o-mini failed:', error);
  // Continue to Level 3
}
```

**Level 3: Secondary Provider (Claude)**
```typescript
if (this.anthropic) {
  try {
    return await this.processClaude(query, messages, config, startTime);
  } catch (error) {
    console.error('Claude failed:', error);
    // Continue to Level 4
  }
}
```

**Level 4: Graceful Degradation**
```typescript
return {
  content: "I apologize, but I'm currently experiencing technical difficulties...",
  model: 'error',
  tokens: 0,
  responseTime: Date.now() - startTime
};
```

### Embeddings Fallback
When OpenAI embeddings are unavailable:
```typescript
// Detect Replit proxy (no embeddings support)
if (baseURL || !this.openai) {
  return this.generateFallbackEmbedding(text);
}

try {
  // Try real embeddings
  return await this.openai.embeddings.create({...});
} catch (error) {
  // Fall back to keyword-based vectors
  return this.generateFallbackEmbedding(text);
}
```

---

## Performance Optimization

### 1. In-Memory Caching
```typescript
private modelConfigs: Map<string, any> = new Map();
private embeddingsCache: Map<string, number[]> = new Map();

// Cache tenant configs to avoid DB queries
private async getModelConfig(organizationId: string) {
  const cached = this.modelConfigs.get(organizationId);
  if (cached) return cached;
  
  const config = await db.select()...;
  this.modelConfigs.set(organizationId, config);
  return config;
}
```

### 2. Embedding Cache Management
```typescript
// Cache with size limit
if (this.embeddingsCache.size > 1000) {
  this.embeddingsCache.clear();  // Prevent memory overflow
}
this.embeddingsCache.set(text, embedding);
```

### 3. Database Indexes
```sql
-- Fast organization + category lookups
CREATE INDEX idx_kb_org_category 
  ON ai_knowledge_base(organization_id, category);

-- Fast active knowledge retrieval
CREATE INDEX idx_kb_search 
  ON ai_knowledge_base(organization_id, is_active);

-- Fast document status queries
CREATE INDEX idx_doc_org 
  ON ai_document_analysis(organization_id, status);
```

---

## Frontend Integration

### AI Chat Component (`client/src/components/AIChat.tsx`)

**Key Features:**
- Real-time streaming-style message display
- Conversation history management
- Loading states and error handling
- Session persistence

**React Query Integration:**
```typescript
const chatMutation = useMutation({
  mutationFn: async (query: string) => {
    return apiRequest('/api/ai/chat', {
      method: 'POST',
      body: { query, sessionId, messages }
    });
  },
  onSuccess: (data) => {
    setMessages([...messages, 
      { role: 'user', content: query },
      { role: 'assistant', content: data.response }
    ]);
    setSessionId(data.sessionId);
  }
});
```

### Knowledge Base Management
```typescript
// Fetch entries
const { data: entries } = useQuery({
  queryKey: ['/api/ai/knowledge', { category, isActive }],
  // Auto-fetches via default queryFn
});

// Add entry
const addMutation = useMutation({
  mutationFn: async (entry) => {
    return apiRequest('/api/ai/knowledge', {
      method: 'POST',
      body: entry
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ 
      queryKey: ['/api/ai/knowledge'] 
    });
  }
});
```

---

## Common Issues & Solutions

### Issue 1: "Invalid API Key" for Claude
**Cause:** `ANTHROPIC_API_KEY` environment variable missing or invalid.

**Solution:**
```bash
# Add valid Anthropic API key to Replit Secrets
ANTHROPIC_API_KEY=sk-ant-api03-xxx
```

**System Behavior:** Falls back to OpenAI models automatically.

### Issue 2: Foreign Key Constraint on `user_id`
**Cause:** Early schema had `user_id REFERENCES users(id)`, causing failures when creating sessions before auth.

**Solution:** Removed foreign key constraint, made field nullable:
```typescript
userId: integer("user_id"), // No .references()
```

### Issue 3: Embeddings Endpoint Not Found
**Cause:** Replit AI Integrations proxy doesn't support embeddings API.

**Solution:** Automatic fallback to keyword-based pseudo-embeddings:
```typescript
if (baseURL) {
  return this.generateFallbackEmbedding(text);
}
```

### Issue 4: Double JSON Stringification
**Cause:** Frontend was stringifying body twice: `JSON.stringify(JSON.stringify(body))`.

**Solution:** Updated `apiRequest` to accept objects directly:
```typescript
// Before
body: JSON.stringify({ query, sessionId, messages })

// After
body: { query, sessionId, messages }
```

---

## Configuration Guide

### Environment Variables

**OpenAI (via Replit AI Integrations):**
```bash
AI_INTEGRATIONS_OPENAI_API_KEY=sk-xxx    # Auto-set by Replit
AI_INTEGRATIONS_OPENAI_BASE_URL=https://... # Auto-set by Replit
```

**Anthropic (Optional):**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxx  # Add to Replit Secrets
```

### Model Configuration (Per Organization)

Default configuration:
```typescript
{
  primaryModel: 'claude-3-5-sonnet-20241022',
  secondaryModel: 'gpt-4o-mini',
  fallbackModel: 'gpt-3.5-turbo',
  maxTokens: 4000,
  temperature: 0.7,
  documentProcessingEnabled: true,
  chatEnabled: true,
  knowledgeBaseEnabled: true
}
```

Override via database:
```sql
INSERT INTO ai_model_configs (organization_id, primary_model, max_tokens)
VALUES ('org-123', 'gpt-4o', 8000);
```

---

## Testing & Monitoring

### Key Metrics Tracked
- **Response Time**: Milliseconds per query
- **Token Usage**: Per session and monthly totals
- **Model Selection**: Which model answered each query
- **Knowledge Base Hits**: How many KB entries were used
- **Error Rates**: Failed queries by model

### Sample Monitoring Query
```sql
-- Daily AI usage by organization
SELECT 
  organization_id,
  DATE(created_at) as date,
  COUNT(*) as total_queries,
  SUM(total_tokens) as tokens_used,
  AVG(response_time) as avg_response_ms,
  model_used
FROM ai_chat_sessions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY organization_id, date, model_used
ORDER BY date DESC, tokens_used DESC;
```

---

## Future Enhancements

### Planned Features
1. **Streaming Responses**: Real-time token-by-token streaming
2. **Multi-modal Support**: Image analysis with GPT-4 Vision
3. **Fine-tuning**: Custom models per organization
4. **Advanced RAG**: Hybrid search with re-ranking
5. **Voice Integration**: Speech-to-text and text-to-speech
6. **Agentic Workflows**: Multi-step autonomous task execution

### Scalability Considerations
- **Redis Caching**: Replace in-memory maps with Redis
- **Pgvector Extension**: Native PostgreSQL vector search
- **Queue System**: Background processing for document analysis
- **Load Balancing**: Distribute AI requests across multiple instances

---

## Conclusion

The ISOHub AI system provides a robust, multi-tenant AI platform with:
- ✅ **Reliability**: Cascading fallback across 3 AI providers
- ✅ **Performance**: In-memory caching and optimized database indexes
- ✅ **Security**: Session-based auth with tenant isolation
- ✅ **Flexibility**: Per-organization model configuration
- ✅ **Intelligence**: Semantic search with 50+ pre-seeded FAQs

The architecture is designed for production use with graceful degradation, comprehensive error handling, and continuous learning through human-in-the-loop corrections.

For questions or issues, refer to the relevant service file:
- **Chat Issues**: `server/services/ai/AIOrchestrationService.ts`
- **Search Issues**: `server/services/ai/VectorSearchService.ts`
- **Training/Corrections**: `server/services/ai/ChatTrainingService.ts`
- **API Routes**: `server/routes/ai.routes.ts`
- **Database Schema**: `shared/schema.ts`
