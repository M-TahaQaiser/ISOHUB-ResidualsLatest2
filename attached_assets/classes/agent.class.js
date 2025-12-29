import { v4 as uuidv4 } from 'uuid';

export default class Agent {
    constructor(organizationID, fName, lName, company, manager, clients, additional_splits,user_id) {
        this.organizationID = organizationID;
        this.agentID = uuidv4();
        this.company = company;
        this.companySplit = '';
        this.manager = manager;
        this.managerSplit = '';
        this.fName = fName;
        this.lName = lName;
        this.agentSplit = '';
        this.clients = clients ? clients : [];
        this.additional_splits = additional_splits ? additional_splits : [];
        this.user_id = user_id;
    }

    updateAgent(data) {
        for (let key in data) {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        }
    }
}