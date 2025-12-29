import React, { useEffect, useState } from 'react';
import { getAllReports } from '../../api/reports.api.js';
import NeedsUpload from '../../components/dashboard/needs-upload/needs-uploaded.component.js';
import NeedsApproval from '../../components/dashboard/needs-approval/needs-approval.component.js';
import NeedsAudit from '../../components/dashboard/needs-audit/needs-audit.component.js';
import APReportExport from '../../components/dashboard/bill.com/apReport.export.js';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Typography,
    CircularProgress,
    Grid,
    Paper,
    Button,
} from '@mui/material';

const Dashboard = ({ organizationID: propOrganizationID, username, authToken }) => {
    const [fetchedReports, setFetchedReports] = useState([]); // All fetched reports
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Get organizationID from localStorage if not passed as a prop
    const organizationID = propOrganizationID || localStorage.getItem('organizationID');

    useEffect(() => {
        if (!organizationID) {
            console.error('No organizationID available.');
            return;
        }

        const fetchReports = async () => {
            setLoading(true);

            try {
                console.log(`Fetching all reports for organization: ${organizationID}...`);

                // Fetch reports using the API
                const reports = await getAllReports(organizationID, authToken);

                console.log('Fetched Reports:', reports);

                // Update the state with all fetched reports
                setFetchedReports(reports);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log('404 Error: No reports found.');
                    setFetchedReports([]); // No reports found
                } else {
                    console.error('Error fetching reports:', error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [authToken, organizationID, location.key]);

    return (
        <div sx={{ padding: 4 }}  className='p-6'>
            {/* Header */}
            <div class="max-w-7xl flex items-center justify-between space-x-3 mx-auto mb-8 bg-yellow-400 rounded-lg p-6 shadow-lg" sx={{  mb: 3 }}>
                <div>
                    <Typography className='text-3xl font-bold text-black font-medium mb-0'  style={{ marginBottom: '0',fontSize: '1.875rem', fontWeight: '600' }}  variant="h4" component="h1" gutterBottom>
                        Welcome, {username}
                    </Typography>
                    <Typography className='text-black/80 mt-0 mb-0 text-left'  style={{ marginBottom: '0',fontSize: '16px', fontWeight: '300' }} variant="h6" component="h2" gutterBottom>
                        Reports for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Typography>
                </div>
                <div>
                    {/* Export AP Report Button */}
                    <APReportExport authToken={authToken} organizationID={organizationID} reports={fetchedReports} />
                </div>
            </div>

            {loading ? (
                <div sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </div>
            ) : (
                <Grid container spacing={3} className='max-w-7xl mx-auto ' style={{ marginLeft:'auto', marginRight:'auto' }}>
                    {/* Needs Upload Card */}
                    <Grid item xs={12} md={4} style={{ paddingLeft:'0' }}>
                        <Paper elevation={3} sx={{ padding: 0 }}  style={{ background:'transparent' }} className='b-maine'>
                            <NeedsUpload reports={fetchedReports} />
                        </Paper>
                    </Grid>

                    {/* Needs Audit Card */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ padding: 0 }} style={{ background:'transparent' }} className='b-maine'>
                            <NeedsAudit reports={fetchedReports} />
                        </Paper>
                    </Grid>

                    {/* Needs Approval Card */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ padding: 0}} style={{ background:'transparent' }} className='b-maine'>
                            <NeedsApproval reports={fetchedReports} authToken={authToken} organizationID={organizationID} />
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </div>
    );
};

export default Dashboard;
