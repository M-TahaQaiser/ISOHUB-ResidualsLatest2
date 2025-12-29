import { db } from '../db';
import { users } from '../../shared/schema';
import { AuthService } from '../services/AuthService';
import { eq } from 'drizzle-orm';

// Migration script to hash existing plaintext passwords
export async function migratePasswords() {
  console.log('🔄 Starting password migration...');
  
  try {
    // Get all users with potentially unhashed passwords
    const allUsers = await db.select().from(users);
    let migratedCount = 0;
    
    for (const user of allUsers) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, etc.)
      if (!user.password.startsWith('$2')) {
        console.log(`🔒 Migrating password for user: ${user.username}`);
        
        // Hash the plaintext password
        const hashedPassword = await AuthService.hashPassword(user.password);
        
        // Update the user record
        await db.update(users)
          .set({ 
            password: hashedPassword,
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));
        
        migratedCount++;
      }
    }
    
    console.log(`✅ Password migration completed. ${migratedCount} passwords migrated.`);
    return { success: true, migratedCount };
    
  } catch (error) {
    console.error('❌ Password migration failed:', error);
    return { success: false, error: error.message };
  }
}

// Migration for SMTP passwords and other sensitive data
export async function migrateSensitiveData() {
  console.log('🔄 Starting sensitive data encryption migration...');
  
  try {
    const { EncryptionService } = await import('../services/EncryptionService');
    const { agencies } = await import('../../shared/schema');
    
    // Get all agencies with potentially unencrypted SMTP passwords
    const allAgencies = await db.select().from(agencies);
    let migratedCount = 0;
    
    for (const agency of allAgencies) {
      let needsUpdate = false;
      const updateData: any = {};
      
      // Encrypt SMTP password if it exists and isn't encrypted
      if (agency.smtpPassword && !agency.smtpPassword.includes(':')) {
        updateData.smtpPassword = EncryptionService.encryptSMTPPassword(agency.smtpPassword);
        needsUpdate = true;
      }
      
      // Encrypt temp password if it exists and isn't encrypted
      if (agency.tempPassword && !agency.tempPassword.includes(':')) {
        updateData.tempPassword = EncryptionService.encrypt(agency.tempPassword);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`🔒 Encrypting sensitive data for agency: ${agency.companyName}`);
        
        updateData.updatedAt = new Date();
        
        await db.update(agencies)
          .set(updateData)
          .where(eq(agencies.id, agency.id));
        
        migratedCount++;
      }
    }
    
    console.log(`✅ Sensitive data encryption completed. ${migratedCount} records migrated.`);
    return { success: true, migratedCount };
    
  } catch (error) {
    console.error('❌ Sensitive data migration failed:', error);
    return { success: false, error: error.message };
  }
}