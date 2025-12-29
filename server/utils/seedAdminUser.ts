import { db } from '../db';
import { users } from '../../shared/schema';
import { eq, or } from 'drizzle-orm';
import { AuthService } from '../services/AuthService';

/**
 * Seeds the default admin user if no admin users exist in the database.
 * This ensures production deployments have at least one admin account to log in with.
 */
export async function seedAdminUser(): Promise<void> {
  try {
    // Check if any admin or superadmin users exist
    const existingAdmins = await db.select()
      .from(users)
      .where(
        or(
          eq(users.role, 'SuperAdmin'),
          eq(users.role, 'Admin')
        )
      )
      .limit(1);

    if (existingAdmins.length > 0) {
      console.log('✅ Admin user already exists, skipping seed');
      return;
    }

    console.log('🔧 No admin users found, creating default admin...');

    // Default admin credentials - should be changed after first login
    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'ISOHub2025!';
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@isohub.io';

    // Check if username already exists (non-admin user)
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.username, defaultUsername))
      .limit(1);

    if (existingUser.length > 0) {
      // Upgrade existing user to admin
      await db.update(users)
        .set({ role: 'SuperAdmin' })
        .where(eq(users.username, defaultUsername));
      console.log(`✅ Upgraded existing user '${defaultUsername}' to SuperAdmin`);
      return;
    }

    // Hash the password
    const hashedPassword = await AuthService.hashPassword(defaultPassword);

    // Create the admin user with minimal required fields
    const adminData: any = {
      username: defaultUsername,
      password: hashedPassword,
      email: defaultEmail,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SuperAdmin',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      isTemporaryPassword: true
    };

    const [newAdmin] = await db.insert(users)
      .values(adminData)
      .returning();

    console.log(`✅ Default admin user created:`);
    console.log(`   Username: ${defaultUsername}`);
    console.log(`   Email: ${defaultEmail}`);
    console.log(`   Role: SuperAdmin`);
    console.log(`   ⚠️  Please change the password after first login!`);

  } catch (error) {
    console.error('❌ Failed to seed admin user:', error);
    // Don't throw - allow server to start even if seeding fails
  }
}
