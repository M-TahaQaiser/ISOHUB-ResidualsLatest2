import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { FaCheck } from "react-icons/fa";
import ReusableTable from "../../../general/table/table.component";
import Totals from "../../../general/totals/totals.component"; 

const BankSummaryReportViewer = ({
    processor,
    mergedData,
    onSave,
    setMergedData, 
    hasChanges,
    setHasChanges,
}) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const [totals, setTotals] = useState({});
    const reportData = mergedData[0]?.reportData || [];

    // ✅ Dynamically generate columns from the report data, excluding "approved"
    const columns = reportData.length > 0
        ? Object.keys(reportData[0])
              .filter(field => field !== "approved")
              .map(field => ({
                  field,
                  label: field,
              }))
        : [];

    // ✅ Add the approved column separately with checkmark logic
    columns.push({
        field: "approved",
        label: "Approved",
        render: (approved) =>
            approved ? (
                <FaCheck color="green" title="Approved" />
            ) : null,
    });

    /**
     * Bulk approval handler
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

        setMergedData((prev) => {
            const updatedMergedData = [...prev];
            updatedMergedData.find((proc) => proc.processor === processor).reportData = updatedReportData;
            return updatedMergedData;
        });

        setSelectedRows([]);
        setHasChanges(true);
    };

    /**
     * Safely handle totals to prevent errors
     */
    const handleTotalsCalculated = (calculatedTotals) => {
        setTotals(calculatedTotals);
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
     * Render the component with Totals included
     */
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                {processor} Bank Summary Report
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
                fileName={`${processor}_BankSummaryReport.csv`}
                enableTotals={true}
                totalFields={columns.map(col => col.field)}
                approvalAction={true}
                onSave={onSave}
                setHasChanges={setHasChanges}
                hasChanges={hasChanges}
            />

            {/* ✅ Safe Handling of Totals to Prevent Runtime Error */}
            <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Calculated Totals</Typography>
                {Object.entries(totals).map(([label, value]) => (
                    <Typography key={label}>
                        {label}: {value != null ? value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }) : "N/A"}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};

export default BankSummaryReportViewer;
