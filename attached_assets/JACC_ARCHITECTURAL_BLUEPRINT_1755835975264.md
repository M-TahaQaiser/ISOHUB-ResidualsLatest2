# JACC Architectural Blueprint
*Complete System Design for Non-Programmers*

## 🏗️ Building Overview
Think of JACC like a sophisticated office building with different floors and departments, all working together to help sales agents in the merchant services industry.

---

## 📋 System Foundation (The Building's Core Structure)

### **Main Building Layers**
```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (Floor 5)                 │
│  📱 Web App  │  💻 Admin Panel  │  📚 Help Guides          │
├─────────────────────────────────────────────────────────────┤
│                   BUSINESS LOGIC (Floor 4)                  │
│  🤖 AI Brain  │  📊 Analytics   │  🔍 Search Engine        │
├─────────────────────────────────────────────────────────────┤
│                  SECURITY & AUTH (Floor 3)                  │
│  🔐 Login     │  👥 User Roles  │  🛡️ Protection           │
├─────────────────────────────────────────────────────────────┤
│                    API LAYER (Floor 2)                      │
│  🌐 Endpoints │  📡 Data Flow   │  🔄 Communication        │
├─────────────────────────────────────────────────────────────┤
│                   DATABASE (Floor 1)                        │
│  🗄️ Data Storage │ 📈 Analytics │ 🔍 Search Index          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏢 Detailed Floor Plans

### **Floor 5: User Interface (What People See)**

#### Main Reception Area (Home Page)
- **Welcome Desk**: Chat interface where users ask questions
- **Navigation Menu**: Links to different areas of the system
- **Status Board**: Shows system health and recent activity

#### Admin Office Suite (Admin Control Center)
- **Executive Dashboard**: Overview of all system metrics
- **User Management Office**: Control who can access what
- **Document Processing Center**: Upload and manage business documents
- **AI Training Room**: Teach the system new responses
- **Settings Department**: Configure how everything works
- **User Guides Library**: Help documentation and tutorials

---

### **Floor 4: Business Logic (The Brain)**

#### AI Department
```
AI Processing Center
├── Claude 4 Sonnet (Primary AI)
├── OpenAI GPT-4.1 Mini (Secondary AI) 
├── Document Analysis Unit
├── Response Generation Center
└── Learning & Training Module
```

#### Analytics & Intelligence Division
- **Business Intelligence**: Analyzes merchant service trends
- **Document Processing**: Reads PDFs, spreadsheets, images
- **Competitive Analysis**: Compares vendors and pricing
- **Performance Metrics**: Tracks system usage and efficiency

#### Search & Discovery Engine
- **Vector Database**: Smart search using AI understanding
- **Knowledge Base**: 179+ FAQ entries about merchant services
- **Document Library**: Searchable repository of business documents
- **Real-time Search**: Instant answers to user questions

---

### **Floor 3: Security & Authentication (The Guards)**

#### Security Command Center
```
Access Control System
├── Multi-Factor Authentication
├── Role-Based Permissions
│   ├── Sales Agent (Basic Access)
│   ├── Client Admin (Management Access)
│   └── Dev Admin (Full System Access)
├── Session Management
├── Password Protection
└── API Key Security
```

#### Integration Security
- **ISO Hub SSO**: Secure connection to external merchant systems
- **CORS Protection**: Controls which websites can connect
- **Rate Limiting**: Prevents system overload
- **Encryption**: Protects sensitive data in transit and storage

---

### **Floor 2: API Layer (The Communication System)**

#### Main Communication Hub
```
API Endpoints (Like Phone Extensions)
├── /api/chat/* - AI Conversation System
├── /api/admin/* - Administrative Functions
├── /api/documents/* - File Management
├── /api/auth/* - Login/Logout System
├── /api/users/* - User Management
├── /api/faq/* - Knowledge Base Access
└── /api/health/* - System Status Monitoring
```

#### External Connections
- **Pinecone Vector Database**: AI-powered search capabilities
- **Anthropic Claude API**: Primary AI processing
- **OpenAI API**: Secondary AI processing
- **ISO Hub Integration**: Merchant services platform connection

---

### **Floor 1: Database (The Foundation)**

#### Main Data Warehouse
```
PostgreSQL Database Structure
├── Users Table (Account Information)
├── Chats Table (Conversation History)
├── Messages Table (Individual Chat Messages)
├── Documents Table (Uploaded Files)
├── FAQ Knowledge Base (179+ Entries)
├── AI Training Data (Learning Records)
├── Admin Settings (System Configuration)
└── Vendor Intelligence (Business Data)
```

#### Specialized Storage Areas
- **Vector Storage**: AI-searchable document content
- **Session Storage**: User login information
- **Encrypted Storage**: Sensitive business data
- **Backup Systems**: Data protection and recovery

---

## 🔄 How Information Flows (Like Plumbing in a Building)

### **User Request Journey**
```
1. User Types Question 
   ↓
2. Security Check (Authentication)
   ↓
3. AI Processing (Understanding & Analysis)
   ↓
4. Database Search (Finding Relevant Information)
   ↓
5. Response Generation (Creating Answer)
   ↓
6. Delivery to User (Formatted Response)
```

### **Document Upload Process**
```
1. User Uploads File
   ↓
2. Security Scan (File Type Check)
   ↓
3. AI Analysis (Document Understanding)
   ↓
4. Vector Processing (Searchable Format)
   ↓
5. Database Storage (Permanent Saving)
   ↓
6. Knowledge Base Update (Available for Search)
```

---

## 🛠️ Technology Stack (Building Materials)

### **Frontend (What Users See)**
- **React 18**: Modern user interface framework
- **TypeScript**: Enhanced programming language for reliability
- **Tailwind CSS**: Professional styling system
- **Wouter**: Navigation between pages
- **Vite**: Fast development and building system

### **Backend (Behind the Scenes)**
- **Node.js**: Server runtime environment
- **Express.js**: Web server framework
- **TypeScript**: Type-safe server programming
- **Drizzle ORM**: Database management system

### **Database & Storage**
- **PostgreSQL (Neon)**: Main data storage
- **Pinecone**: AI vector search database
- **File System**: Document and image storage

### **AI & External Services**
- **Anthropic Claude 4 Sonnet**: Primary AI processing
- **OpenAI GPT-4.1 Mini**: Secondary AI processing
- **Vector Search**: Intelligent document retrieval

---

## 🔧 Key Features (Building Amenities)

### **For Regular Users (Sales Agents)**
✅ **AI Chat Assistant**: Ask questions about merchant services
✅ **Document Analysis**: Upload and analyze business documents
✅ **Knowledge Base Access**: Search 179+ FAQ entries
✅ **Mobile Friendly**: Works on phones and tablets
✅ **Real-time Responses**: Instant AI-powered answers

### **For Administrators**
✅ **User Management**: Control who has access
✅ **System Monitoring**: Track performance and health
✅ **AI Training**: Improve responses through feedback
✅ **Document Management**: Organize uploaded files
✅ **Settings Control**: Configure system behavior
✅ **WordPress-Style Editor**: Edit AI responses individually

### **For System Health**
✅ **Memory Monitoring**: Tracks system resource usage
✅ **Performance Analytics**: Measures response times
✅ **Error Handling**: Automatically handles problems
✅ **Backup Systems**: Protects against data loss
✅ **Security Auditing**: Monitors for threats

---

## 📊 System Specifications (Building Capacity)

### **Performance Metrics**
- **Response Time**: Usually under 3 seconds
- **Concurrent Users**: Supports multiple simultaneous users
- **Document Processing**: Handles PDFs, images, spreadsheets
- **Knowledge Base**: 179+ merchant services FAQ entries
- **Memory Usage**: Optimized to stay under 400MB
- **File Upload**: Up to 100MB per file, 50 files at once

### **Security Standards**
- **Encryption**: AES-256-GCM for sensitive data
- **Authentication**: Multi-factor with role-based access
- **Session Security**: 7-day timeout with strict settings
- **Rate Limiting**: Prevents system abuse
- **CORS Protection**: Controls external access

---

## 🚀 Current System Status (Building Occupancy)

### **Fully Operational Components**
✅ **User Authentication**: Login/logout working perfectly
✅ **Admin Control Center**: All 7 tabs functional
✅ **AI Chat System**: Claude 4 Sonnet responding accurately
✅ **Document Processing**: File uploads and analysis working
✅ **Knowledge Base**: 179 FAQ entries searchable
✅ **Memory Monitoring**: System health tracking active
✅ **User Guides**: Help documentation accessible
✅ **WordPress Editor**: Individual response editing available

### **System Integrations**
✅ **Database**: 8 users, 200 documents, 179 FAQ entries
✅ **AI Services**: Claude 4 Sonnet + OpenAI GPT-4.1 Mini
✅ **Vector Search**: Pinecone database connected
✅ **Security**: All authentication and protection active
✅ **Monitoring**: Memory usage tracking at 391MB/400MB

---

## 💡 Think of JACC Like This:

**JACC is like having a super-smart assistant** who:
1. **Knows everything about merchant services** (from the knowledge base)
2. **Can read and understand documents** (AI document analysis)
3. **Remembers all conversations** (chat history)
4. **Has a powerful search system** (vector database)
5. **Can be trained to get better** (AI learning system)
6. **Has a professional admin office** (control center)
7. **Is available 24/7** (web-based system)

This blueprint shows you exactly how your JACC system is built and how all the pieces work together to create a powerful AI assistant for merchant services sales agents.

---

*Last Updated: August 22, 2025*
*System Status: Fully Operational*