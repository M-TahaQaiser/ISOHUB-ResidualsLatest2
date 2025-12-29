import React from 'react';
import './agents.page.css';

import AgentsUploader from '../../../components/agents/agents-upload/agents-upload.component.js';

const Agents = ({ organizationID, authToken }) => {
    return (
        <div className="homepage">
            {/* Hero Section */}
            <AgentsUploader  organizationID={organizationID} authToken={authToken} />
        </div>
    );
};

export default Agents;
