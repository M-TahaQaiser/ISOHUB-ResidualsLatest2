import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { FaCheck } from "react-icons/fa";
import ReusableTable from "../../../general/table/table.component.js";
import processorTypeMap from "../../../../lib/typeMap.lib.js";

const AgentReportViewer = ({
    processor,
    mergedData,
    onSave,
    setMergedData, 
    hasChanges,
    setHasChanges, 
}) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const reportData = mergedData[0]?.reportData || [];
    const processorType = processorTypeMap[processor] || "type1";

    /**
     * ✅ Columns generated directly from the report data headers
     * - Removed the calculation logic for "Agent Net"
     */
    const columns = reportData.length > 0
        ? Object.keys(reportData[0])
              .filter((field) => field !== "approved") // Exclude 'approved' from headers
              .map((field) => ({
                  field,
                  label: field,
              }))
        : [];

    /**
     * ✅ Keep the approved column logic as requested
     */
    columns.push({
        field: "approved",
        label: "Approved",
        render: (approved) =>
            approved ? (
                <FaCheck color="green" title="Approved" />
            ) : null,
    });

    /**
     * ✅ Bulk approval handler
     */
    const handleBulkApprove = () => {
        if (selectedRows.length === 0) {
            alert("No rows selected for approval.");
            return;
        }

        const updatedReportData = reportData.map((row) =>
            selectedRows.includes(row["Merchant Id"])
                ? { ...row, approved: true }
                : row
        );

        // ✅ Update merged data
        setMergedData((prev) => {
            const updatedMergedData = [...prev];
            updatedMergedData.find(
                (proc) => proc.processor === processor
            ).reportData = updatedReportData;
            return updatedMergedData;
        });

        setSelectedRows([]); 
        setHasChanges(true); 
    };

    const filterConfig = [
        { label: "Needs Audit", field: "needsAudit", type: "checkbox" },
        { label: "Approved", field: "approved", type: "checkbox" },
    ];

    const actions = [
        {
            name: "Bulk Approve",
            onClick: handleBulkApprove,
        },
    ];

    /**
     * ✅ Render Component (No Agent Net Calculations)
     */
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                {processor} Agent Report
            </Typography>
            <ReusableTable
                data={reportData}
                setData={(updatedData) => {
                    setMergedData((prev) => {
                        const updatedMergedData = [...prev];
                        updatedMergedData.find(
                            (proc) => proc.processor === processor
                        ).reportData = updatedData;
                        return updatedMergedData;
                    });
                    setHasChanges(true); 
                }}
                idField="Merchant Id"
                columns={columns}
                filtersConfig={filterConfig}
                actions={actions}
                enableSearch={true}
                selected={selectedRows}
                setSelected={setSelectedRows}
                fileName={`${processor}_AgentReport.csv`}
                enableTotals={true}
                approvalAction={true}
                onSave={onSave}
                setHasChanges={setHasChanges}
                hasChanges={hasChanges}
            />
        </Box>
    );
};

export default AgentReportViewer;
