import { MongoClient } from 'mongodb';

interface MongoVendor {
  _id?: any;
  name: string;
  category: string;
  description?: string;
  loginUrl?: string;
  logoUrl?: string;
  isActive?: boolean;
}

export class MongoVendorService {
  private client: MongoClient;
  
  constructor() {
    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL environment variable is required');
    }
    this.client = new MongoClient(process.env.MONGODB_URL);
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.close();
  }

  async getVendors(): Promise<MongoVendor[]> {
    try {
      await this.connect();
      const db = this.client.db('Tracer');
      const collection = db.collection('vendors');
      const vendors = await collection.find({}).toArray();
      return vendors.map(vendor => ({
        name: vendor.name,
        category: vendor.category || 'Processors',
        description: vendor.description,
        loginUrl: vendor.loginUrl || vendor.login_url,
        logoUrl: vendor.logoUrl || vendor.logo_url,
        isActive: vendor.isActive !== false
      }));
    } catch (error) {
      console.error('Error fetching vendors from MongoDB:', error);
      return [];
    } finally {
      await this.disconnect();
    }
  }

  async getVendorsByCategory(category: string): Promise<MongoVendor[]> {
    try {
      await this.connect();
      const db = this.client.db('Tracer');
      const collection = db.collection('vendors');
      const vendors = await collection.find({ category }).toArray();
      return vendors.map(vendor => ({
        name: vendor.name,
        category: vendor.category || category,
        description: vendor.description,
        loginUrl: vendor.loginUrl || vendor.login_url,
        logoUrl: vendor.logoUrl || vendor.logo_url,
        isActive: vendor.isActive !== false
      }));
    } catch (error) {
      console.error(`Error fetching ${category} vendors from MongoDB:`, error);
      return [];
    } finally {
      await this.disconnect();
    }
  }

  // Check if vendors collection exists and has data
  async hasVendorData(): Promise<boolean> {
    try {
      await this.connect();
      const db = this.client.db('Tracer');
      const collections = await db.listCollections({ name: 'vendors' }).toArray();
      if (collections.length === 0) return false;
      
      const collection = db.collection('vendors');
      const count = await collection.countDocuments();
      return count > 0;
    } catch (error) {
      console.error('Error checking MongoDB vendor data:', error);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

export const mongoVendorService = new MongoVendorService();