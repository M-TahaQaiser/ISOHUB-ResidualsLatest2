import { db } from '../lib/database.lib.js';
import Constants from '../lib/constants.lib.js';

export default class AgentsModel {

    static createAgent = async (agent) => {
        try {
            const result = await db.dbAgents().insertOne(agent);
            if (!result.acknowledged) {
                throw new Error('Model Error: Error adding agent to DB');
            }
            return result;
        } catch (error) {
            throw error;
        }
    };

    static createAgents = async (agents) => {
        try {
            const result = await db.dbAgents().insertMany(agents);
            if (!result.acknowledged) {
                throw new Error('Model Error: Error adding agents to DB');
            }
            return result;
        } catch (error) {
            throw error;
        }
    };
    
    static getAgent = async (organizationID, agentID) => {
        try {
            const agent = await db.dbAgents().findOne({organizationID,  agentID }, { projection: Constants.DEFAULT_PROJECTION });
            if (!agent) {
                return { message: `No agent found with ID ${agentID}` };
            }
            return agent;
        } catch (error) {
            throw error; // Make sure error is thrown for consistency
        }
    }

    static getAgents = async (organizationID) => {
        try {
            const agents = await db.dbAgents().find({organizationID}, { projection: Constants.DEFAULT_PROJECTION }).toArray();
            if (agents.length === 0) {
                return { message: 'No agents found' };
            }
            return agents;
        } catch (error) {
            throw error;
        }
    };

    static updateAgent = async (organizationID, agent) => {
        try {
            const result = await db.dbAgents().replaceOne({organizationID,  agentID: agent.agentID }, agent);
            if (result.matchedCount === 0) {
                return { message: 'Agent not found to update' };
            }
            if (!result.acknowledged) {
                throw new Error('Model Error: Error updating agent in DB');
            }
            return result;
        } catch (error) {
            throw error;
        }
    };

    static deleteAgent = async (organizationID, agentID) => {
        try {
            const result = await db.dbAgents().deleteOne({organizationID,  agentID });
            if (result.deletedCount === 0) {
                return { message: 'Agent not found to delete' };
            }
            if (!result.acknowledged) {
                throw new Error('Model Error: Error deleting agent in DB');
            }
            return result;
        } catch (error) {
            throw error;
        }
    };

    static getMerchantByID = async (organizationID, merchantID) => {
        try {
            const agent = await db.dbAgents().findOne(
                { 
                    organizationID,
                    'clients.merchantID': merchantID 
                },
                { 
                    projection: {
                        'clients.$': 1,
                        fName: 1,
                        lName: 1,
                        agentID: 1,
                        company: 1,
                        manager: 1,
                        agentSplit: 1,
                        managerSplit: 1
                    }
                }
            );
            
            if (!agent) {
                return { message: `No merchant found with ID ${merchantID}` };
            }

            // Get the matching client from the clients array
            const merchant = agent.clients.find(client => client.merchantID === merchantID);
            
            // Transform merchant data if agentSplit exists
            let transformedMerchant = { ...merchant };
            if (merchant.agentSplit) {
                transformedMerchant = {
                    merchantID: merchant.merchantID,
                    merchantName: merchant.merchantName,
                    branchID: merchant.branchID,
                    agent: [{
                        name: `${agent.fName} ${agent.lName}`,
                        split: merchant.agentSplit
                    }]
                };

                // Add other existing properties
                if (merchant.partners) transformedMerchant.partners = merchant.partners;
                if (merchant.reps) transformedMerchant.reps = merchant.reps;
                if (merchant.totalRepsSplitCount) transformedMerchant.totalRepsSplitCount = merchant.totalRepsSplitCount;
            }
            
            return {
                merchant: transformedMerchant,
                agent: {
                    fName: agent.fName,
                    lName: agent.lName,
                    agentID: agent.agentID,
                    company: agent.company,
                    manager: agent.manager,
                    managerSplit: agent.managerSplit,
                    agentSplit: agent.agentSplit
                }
            };
        } catch (error) {
            throw error;
        }
    };

    static getAgentByUserId = async (organizationID, userId) => {
        try {
            const agent = await db.dbAgents().findOne(
                { 
                    organizationID,
                    user_id: userId 
                },
                { projection: Constants.DEFAULT_PROJECTION }
            );
            return agent;
        } catch (error) {
            throw error;
        }
    };
}
