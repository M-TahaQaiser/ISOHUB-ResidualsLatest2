import c from "config";
import Agent from "../classes/agent.class.js";
import map from "../lib/branchIDMap.lib.js";
import LeadScrubberUtil from "./leadScrubber.util.js";

const PARTNER_MAPPING = {
    hbs: { partner: 'HBS', split: '35%' },
    sib: { partner: 'SIB', split: '30%' },
    aez: { partner: 'AEZ', split: '40%' },
    pharmatrush: { partner: 'PharmaTrush', split: '20%' },
    "johnathan": { partner: 'Johnathan Mosley', split: '20%' },
    castech: { partner: 'CasTech', split: '40%' },
    alex: { partner: 'Alex Stauffer', split: '40%' },
    "jason": { partner: 'Jason Knapp', split: '40%' },
    "robert": { partner: 'Robert Day', split: '5%' },
};

export default class AgentsUtil {
    static buildAgentsArray = (organizationID, agents, csvData) => {
        try {
            const existingMIDs = new Set();
            agents.forEach(agent => {
                agent.clients.forEach(client => {
                    existingMIDs.add(client.merchantID);
                });
            });

            const { statusFail, needsAudit, validLeads } = LeadScrubberUtil.scrubLeads(csvData, existingMIDs);
    
                const agentsArray = [...agents];

            validLeads.forEach((row) => {
                const assignedUsers = row['assignedUsers'] ? row['assignedUsers'].split(', ') : [];
                let fName, lName, company = null, manager = null, partner = null;
                const mid = row['Existing MID'];



                if (mid === '11134' || mid === '11133') {
                    console.log('Processing problematic row in forEach:', row);
                }
                //console.log(`Processing row for MID ${row['Existing MID']} with assigned users: ${assignedUsers}`);

                // Step 1: Determine roles based on number of users
                if (assignedUsers.length === 1) {
                    // Single user - they are the agent
                    ({ fName, lName } = parseUser(assignedUsers[0]));
                    company = fName === "Christy" ? "Tracer" : "c2fs";
                } else if (assignedUsers.length === 2) {
                    // Two users - identify manager or partner, remaining is agent
                    assignedUsers.forEach(user => {
                        if (LeadScrubberUtil.managers.some(manager => user.includes(manager))) {
                            manager = user;
                        } else if (LeadScrubberUtil.partners.some(partner => user.includes(partner))) {
                            partner = user;
                        } else {
                            ({ fName, lName } = parseUser(user));
                        }
                    });
                    if (manager && partner) {
                        // If both manager and partner are present, assign manager to agent
                        //console.log(`Both manager and partner present for MID ${row['Existing MID']}. Assigning ${manager} to agent.`);
                        ({ fName, lName } = parseUser(manager));
                        //console.log(fName, lName);
                    }

                    company = fName === "Christy" ? "Tracer" : "C2FS Partner 0827";
                } else if (assignedUsers.length === 3) {
                    // Three users - identify partner, manager, and agent
                    assignedUsers.forEach(user => {
                        if (LeadScrubberUtil.partners.some(partner => user.includes(partner))) {
                            partner = user;
                        } else if (LeadScrubberUtil.managers.some(manager => user.includes(manager))) {
                            manager = user;
                        } else {
                            ({ fName, lName } = parseUser(user));
                        }
                    });
                    company = fName === "Christy" ? "Tracer CoCard" : "C2FS Partner 0827";
                }

                console.log(`Determined roles for MID ${row['Existing MID']} - Agent: ${fName} ${lName}, Manager: ${manager}, Partner: ${partner}, Company: ${company}`);

                // Step 2: Add or update agent in agentsArray
                if (fName && lName) {
                    const agentIndex = findAgentIndex(agentsArray, fName, lName);
                    console.log('Agent Index:', agentIndex);
                    if (agentIndex !== -1) {
                        updateExistingAgent(agentsArray, agentIndex, row);
                        console.log(`Updated existing agent: ${fName} ${lName}\n`);
                    } else {
                        createNewAgent(agentsArray, organizationID, fName, lName, company, manager, row);
                        console.log(`Created new agent: ${fName} ${lName}, company: ${company}, manager: ${manager}\n`);
                    }
                } else {
                    console.error('No valid agent found for row:', row);
                }

                if (mid === '820100012880') {
                    console.log('Row successfully processed:', row);
                }
            });

            return { agentsArray, needsAudit, rejectedMerchants: statusFail };
        } catch (error) {
            throw new Error('Error building agents: ' + error.message);
        }
    };
}

// Helper functions remain the same

const parseUser = (user) => {
    try {
        const nameParts = user.split(' ').filter(n => !/^[0-9-]+$/.test(n) && n.trim() !== '');
        const lowerCaseUser = user.toLowerCase();
        let result = {};

        // Check for company match
        if (lowerCaseUser.includes('c2fs') || lowerCaseUser.includes('tracer')) {
            result.company = nameParts[0];
        }

        // Check for partner match
        const partnerEntry = Object.keys(PARTNER_MAPPING).find(partnerKey =>
            lowerCaseUser.includes(partnerKey)
        );

        if (partnerEntry) {
            result.partner = PARTNER_MAPPING[partnerEntry].partner;
        } else if (nameParts.length >= 2) {
            result.fName = nameParts[0];
            result.lName = nameParts.slice(1).join(' ');
        } else {
            result.fName = nameParts[0];
        }

        return result;
    } catch (error) {
        console.error('Error parsing user:', user, error.message);
        return {};
    }
};

const findAgentIndex = (agents, fName, lName) => {
    return agents.findIndex(agent =>
        agent.fName === fName && agent.lName === lName
    );
};

const updateExistingAgent = (agents, agentIndex, row) => {
    const agent = agents[agentIndex];
    const merchant = buildMerchant(row);

    const midExists = agent.clients.some(client => client.merchantID === merchant.merchantID);
    if (!midExists) {
        agent.clients.push(merchant);
    }
};

const createNewAgent = (agentsArray, organizationID, fName, lName, company, manager, row) => {
    const newAgent = new Agent(organizationID, fName, lName, company, manager);
    newAgent.clients = [buildMerchant(row)];
    agentsArray.push(newAgent);
};



const buildMerchant = (row) => {
    const assignedUsers = row['assignedUsers']
        .split(', ')
        .map(user => parseUser(user));

    // Find the first partner user
    const partnerUser = assignedUsers.find(user => user.partner);

    let partner = null;
    let partnerSplit = null;

    if (partnerUser) {
        partner = partnerUser.partner;
        const partnerEntry = Object.keys(PARTNER_MAPPING).find(key =>
            partner.toLowerCase() === PARTNER_MAPPING[key].partner.toLowerCase()
        );
        partnerSplit = partnerEntry ? PARTNER_MAPPING[partnerEntry].split : null;
    }

    if (row['Existing MID'] === '11134' || row['Existing MID'] === '11133') {
        console.log('Building merchant for problematic row:', row);
        console.log('Assigned users:', assignedUsers);
    }

    return {
        merchantID: row['Existing MID'].toString().trim().replace(/'/g, ''), // Remove single quotes,
        merchantName: row['DBA'] || row['Legal Name'],
        branchID: row['Partner Branch Number'] || null,
        partner,
        partnerSplit
    };
};


