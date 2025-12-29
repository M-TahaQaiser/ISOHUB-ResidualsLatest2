import React from 'react';
import './agents.page.css';

import AgentsList from '../../../components/agents/agents-list/agents-list.component';

const Agents = ({ organizationID, authToken }) => {
    return (
        <div className="homepage p-6">
            {/* Hero Section */}
            <AgentsList  organizationID={organizationID} authToken={authToken} />
        </div>
    );
};

export default Agents;
