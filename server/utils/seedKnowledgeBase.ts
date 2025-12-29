import { KnowledgeBaseSeeder } from '../services/ai/KnowledgeBaseSeeder';
import { db } from '../db';
import { aiKnowledgeBase } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export async function seedKnowledgeBase() {
  try {
    console.log('🌱 Starting knowledge base seed...');
    
    // Default organization ID (will be updated for multi-tenancy)
    const organizationId = 'org-86f76df1';
    
    // Check if knowledge base already has entries
    const existing = await db
      .select()
      .from(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.organizationId, organizationId))
      .limit(1);
    
    if (existing.length > 0) {
      console.log('✅ Knowledge base already seeded');
      return { message: 'Knowledge base already contains data', count: 0 };
    }
    
    // Seed the knowledge base
    const count = await KnowledgeBaseSeeder.seedForOrganization(organizationId);
    
    console.log(`✅ Successfully seeded ${count} knowledge base entries`);
    
    // Get category summary
    const summary = KnowledgeBaseSeeder.getCategorySummary();
    console.log('📊 Category Summary:', summary);
    
    return { 
      message: 'Knowledge base seeded successfully', 
      count,
      categories: summary 
    };
  } catch (error) {
    console.error('❌ Error seeding knowledge base:', error);
    throw error;
  }
}

// Run if called directly
seedKnowledgeBase()
  .then((result) => {
    console.log('Seed result:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });