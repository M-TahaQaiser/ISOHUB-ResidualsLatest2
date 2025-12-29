import { MongoClient } from 'mongodb';
import Constants from '../lib/constants.lib.js';

class Database {
  _instance = null;

  init = async (config) => {
    const client = new MongoClient(config.url, {
      minPoolSize: config.minPoolSize,
      maxPoolSize: config.maxPoolSize,
    });
    try {
      await client.connect();
      console.log('mongodb connected');
    } catch (err) {
      console.error(`Error connecting to mongoDB. Error: ${err}`);
    }
    this._instance = client.db(config.database);
  };

  getDb = () => {
    return this._instance;
  };

  dbUsers = () => {
    return this._instance.collection(Constants.USERS_COLLECTION);
  };

  dbReports = () => {
    return this._instance.collection(Constants.REPORTS_COLLECTION);
  };

  dbAgents = () => {
    return this._instance.collection(Constants.AGENTS_COLLECTION);
  };

  dbInvoices = () => {
    console.log('Accessing invoices collection');
    return this._instance.collection(Constants.INVOICES_COLLECTION);
  };

}

export const db = new Database();
