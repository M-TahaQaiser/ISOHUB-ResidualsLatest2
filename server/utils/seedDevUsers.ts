import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { AuthService } from '../services/AuthService';

export async function seedDevUsers(): Promise<void> {
  try {
    console.log('🔧 Checking if initial users need to be seeded...');
    
    // Check if any users exist
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('✅ Users already exist, skipping seed');
      return;
    }

    console.log('🔧 Seeding initial users...');

    const devUsers = [
      { username: 'dev', password: 'dev123', role: 'Users/Reps', email: 'dev@local' },
      { username: 'admin', password: 'admin123', role: 'SuperAdmin', email: 'admin@local' },
      { username: 'superadmin', password: 'superadmin123', role: 'SuperAdmin', email: 'superadmin@local' },
      { username: 'test', password: 'test123', role: 'Users/Reps', email: 'test@local' }
    ];

    for (const u of devUsers) {
      const [existing] = await db.select().from(users).where(eq(users.username, u.username)).limit(1);
      if (existing) {
        console.log(`  - User '${u.username}' already exists, skipping`);
        continue;
      }

      const hashed = await AuthService.hashPassword(u.password);
      const [created] = await db.insert(users).values({
        username: u.username,
        password: hashed,
        email: u.email,
        role: u.role,
        isActive: true,
        mfaEnabled: false,
        failedLoginAttempts: 0
      }).returning();

      console.log(`  - Created dev user '${u.username}'`);
    }

    console.log('✅ Dev users seeded');
  } catch (error) {
    console.error('❌ Failed to seed dev users:', error);
  }
}
