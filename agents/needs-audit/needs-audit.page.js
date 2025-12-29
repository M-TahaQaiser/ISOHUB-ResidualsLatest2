import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { reauditAgents } from '../../../api/agents.api';
import NeedsAudit from '../../../components/agents/needs-audit/needs-audit.component';
import RejectedMerchants from '../../../components/agents/rejected-merchants/rejected-merchants.component';
import './needs-audit.page.css';

const NeedsAuditPage = ({ organizationID, authToken }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [needsAudit, setNeedsAudit] = useState(location.state?.needsAudit || []);
    const [rejectedMerchants, setRejectedMerchants] = useState(location.state?.rejectedMerchants || []);
    const [activeTab, setActiveTab] = useState('needsAudit');

    useEffect(() => {
        console.log('NeedsAuditPage loaded with data:', {
            needsAudit,
            rejectedMerchants,
        });
    }, []);

    useEffect(() => {
        console.log('Updated Needs Audit:', needsAudit);
    }, [needsAudit]);

    useEffect(() => {
        console.log('Updated Rejected Merchants:', rejectedMerchants);
    }, [rejectedMerchants]);

    const exportToCSV = () => {
        const data = activeTab === 'needsAudit' ? needsAudit : rejectedMerchants;
        const filename = activeTab === 'needsAudit' ? 'NeedsAudit' : 'RejectedMerchants';

        if (!data || data.length === 0) {
            console.warn(`No data available to export for ${filename}`);
            return;
        }

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(','), ...data.map(item =>
            headers.map(header => `"${String(item[header]).replace(/"/g, '""')}"`).join(',')
        )];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.hidden = true;
        a.href = url;
        a.download = `${filename}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        console.log(`CSV export completed for ${filename}`);
    };

    const handleReAudit = async () => {
        try {
            const response = await reauditAgents(organizationID, needsAudit, authToken);

            if (!response.data || (response.data.needsAudit.length === 0 && response.data.rejectedMerchants.length === 0)) {
                navigate('/agents');
            } else {
                // Update needsAudit and rejectedMerchants with the new data from the response
                setNeedsAudit(response.data.needsAudit || []);
                setRejectedMerchants(response.data.rejectedMerchants || []);
                console.log('Re-audit completed. New data:', response.data);
            }
        } catch (error) {
            console.error('Re-audit error:', error);
        }
    };

    return (
        <div className="needs-audit-page">
            <header>
            <h1>Audit Review</h1>

            <div className="na-action-buttons">
                <button onClick={exportToCSV} className="export-btn">Export</button>
                <button onClick={handleReAudit} className="re-audit-btn">Re-Audit</button>
            </div>
        </header>
            <div className="tabs">
                <div
                    className={`tab  ${activeTab === 'needsAudit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('needsAudit')}
                >
                    Needs Audit
                </div>
                <div
                    className={`tab ${activeTab === 'rejectedMerchants' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rejectedMerchants')}
                >
                    Rejected Merchants
                </div>
            </div>

            <div className="tab-content">
                {activeTab === 'needsAudit' ? (
                    <NeedsAudit data={needsAudit} key={needsAudit.length} />
                ) : (
                    <RejectedMerchants data={rejectedMerchants} />
                )}
            </div>
        </div>
    );
};

export default NeedsAuditPage;
