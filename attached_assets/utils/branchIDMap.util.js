import AgentsModel from "../models/agents.model.js";

export const getBranchIDMap = async (organizationID) => {
    try {
        const agents = await AgentsModel.getAgents(organizationID);
        const branchIDMap = {};
        agents.forEach(agent => {
            if (agent.clients) {
                agent.clients.forEach(client => {
                    branchIDMap[client.merchantID] = {
                        branchID: client.branchID,
                        bankSplit: parseFloat(client.bankSplit) / 100
                    };
                });
            };
        });
        return branchIDMap;
    } catch (error) {
        throw new Error('Error getting branchIDMap: ' + error.message);

    };
};

export default getBranchIDMap;