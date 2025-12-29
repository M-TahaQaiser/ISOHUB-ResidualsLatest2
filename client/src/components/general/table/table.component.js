import React, { useState, useMemo } from "react";
import {
  Button,
  Typography,
  TablePagination,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from "@mui/material";
import FilterComponent from "../filter/filter.component";
import ActionsColumn from "../actionsColumn/actionsColumn.component";
import Totals from "../totals/totals.component";
import EditDialog from "../editDialog/editDialog.component"; // Import the EditDialog component
import { exportToCSV } from '../../../utils/export.util';
import Decimal from "decimal.js";

const TableWithFilters = ({
  data = [],
  setData,
  idField = "id",
  columns = [],
  filtersConfig = [],
  actions = [],
  enableSearch = false,
  selected = [],
  setSelected,
  approvalAction = false,
  fileName,
  hasChanges,
  setHasChanges,
  enableTotals = false,
  onSave,
  totalFields = [],
  onDelete,
  editDialogProps,
  agentDetails,
  merchantPartnerSlug
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [totals, setTotals] = useState({});

  console.log(data,'datadatadata');


  const handleDelete = (rowId) => {
    if (onDelete) {
      onDelete(rowId);
    } else {
      const updatedData = data.filter((row) => row[idField] !== rowId);
      setSelected(selected.filter((id) => id !== rowId));
      setData(updatedData);
      setHasChanges(true);
    }
  };

  const handleBulkDelete = () => {
    if (selected.length === 0) {
      alert("No rows selected for deletion.");
      return;
    }

    const updatedData = data.filter((row) => !selected.includes(row[idField]));
    setData(updatedData); // Update the data with unselected rows
    setSelected([]); // Clear the selected rows
    alert("Selected rows deleted successfully!");
  };

  const handleExportToCSV = () => {
    if (!filteredData || filteredData.length === 0) {
        alert("No data available to export.");
        return;
    }

    // ✅ List of columns that should NOT be totaled
    const nonTotableColumns = [
        "Needs Audit", "customerID", "invoiceNum", "invoiceDate", 
        "dueDate", "lineItemName", "approved", "Name", "Agent Id"
    ];

    // ✅ Calculate totals only for numeric columns and skip non-totable columns
    const totals = columns.reduce((acc, col) => {
        if (!nonTotableColumns.includes(col.field)) {
            const allNumeric = filteredData.every(row => !isNaN(parseFloat(row[col.field])));
            if (allNumeric) {
                acc[col.field] = filteredData.reduce((sum, row) => sum + (parseFloat(row[col.field]) || 0), 0);
            }
        }
        return acc;
    }, {});

    // ✅ Debugging to verify totals alignment
    console.log("Calculated Totals:", totals);

    // ✅ Export data along with corrected totals
    exportToCSV(filteredData, columns, totals, fileName || "report.csv",agentDetails);
};




  const handleApprove = (rowId) => {
    const updatedData = data.map((row) =>
      row[idField] === rowId
        ? { ...row, approved: true, needsAudit: false }
        : row
    );
    setData(updatedData);
    setHasChanges(true); // Set changes flag
  };

  const handleSave = (updatedRow) => {
    // console.log('updatedRow',updatedRow);
    // const updatedData = data.map(row =>
    //   row["merchantID"] === updatedRow["merchantID"] ? updatedRow : row
    // );
    let updatedData = '';

    if(merchantPartnerSlug === 'merchantPartnerSlug'){
      updatedData = data.map(row =>
      row["merchantID"] === updatedRow["merchantID"] ? updatedRow : row
      );
    }else{
       updatedData = data.map(row =>
       row["Merchant Id"] === updatedRow["Merchant Id"] ? updatedRow : row
    );

    }

    // console.log('updatedData',updatedData);
    // console.log('updatedRow',updatedRow);
    // console.log('data',data);
    // return false;
    setData(updatedData);
    setEditDialogOpen(false);
    setEditRow(null);
    setHasChanges(true);
  };




  const handleFilterChange = (updatedFilters) => {
    setFilters(updatedFilters);
    if (updatedFilters.searchTerm !== undefined) setSearchTerm(updatedFilters.searchTerm);
    setPage(0);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) setSelected(data.map((row) => row[idField]));
    else setSelected([]);
  };

  const handleSelectRow = (rowId) => {
    setSelected((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  const handleEdit = (rowId) => {
    // Find the merchant by idField
    const merchant = data.find(row => row[idField] === rowId);
    setEditRow(merchant);
    setEditDialogOpen(true);
  };

  const handleCancel = () => {
    setEditDialogOpen(false); // Close the dialog
    setEditRow(null); // Reset the edited row
  };

  console.log('editRow',editRow);

  const filteredData = useMemo(() => {
    let filtered = data;


    Object.keys(filters).forEach((field) => {
      const value = filters[field];
      const columnConfig = filtersConfig.find((config) => config.field === field);

      if (value !== null && value !== "" && columnConfig) {

        if (columnConfig.type === "checkbox") {
          filtered = filtered.filter((row) => row[field] === value);
        } else if (columnConfig.type === "hasValue") {
          filtered = filtered.filter(
            (row) => row[field] !== null && row[field] !== undefined && row[field] !== ""
          );
        } else if (columnConfig.type === "text") {
          filtered = filtered.filter((row) =>
            row[field]?.toString().toLowerCase().includes(value.toString().toLowerCase())
          );
        }
      }
    });

    // Apply search term filter globally
    if (searchTerm) {

      filtered = filtered.filter((row) =>
        columns.some((col) =>
          row[col.field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    return filtered;
  }, [data, filters, searchTerm, columns, filtersConfig]);




  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box class="max-w-7xl mx-auto bg-zinc-900 rounded-lg shadow-sm p-6 mb-8 ">

      {enableTotals && <Totals data={filteredData} columns={totalFields} />}
      <FilterComponent
        filtersConfig={filtersConfig}
        onFilterChange={handleFilterChange}
        enableSearch={enableSearch}
        filteredData={filteredData}
        actions={actions}
        onExport={handleExportToCSV}
        onDelete={handleBulkDelete}
        onTotalsCalculated={(calculatedTotals) => setTotals(calculatedTotals)}
      />
      <TableContainer >

        <Table stickyHeader className="tb-main">
          <TableHead>
            <TableRow>
              {setSelected && (
                <TableCell align="center" padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell align="center" key={col.field} className="border-b px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {col.label}
                </TableCell>
              ))}
              {approvalAction && <TableCell align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <TableRow key={row[idField]}>
                  {setSelected && (
                    <TableCell  align="center" padding="checkbox">
                      <Checkbox
                        checked={selected.includes(row[idField])}
                        onChange={() => handleSelectRow(row[idField])}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell align="center" key={col.field}>
                        {col.render 
                            ? col.render(row[col.field], row) 
                            : (typeof row[col.field] === "number" 
                                ? new Decimal(row[col.field]).toDecimalPlaces(2).toNumber().toFixed(2) 
                                : row[col.field])
                        }
                    </TableCell>
                ))}
                  {approvalAction && (
                    <TableCell align="center" className="hrtd">
                      <ActionsColumn
                        onEdit={() => handleEdit(row[idField])}
                        onDelete={() => handleDelete(row[idField])}
                        onApprove={() => handleApprove(row[idField])}
                      />

                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell align="center" colSpan={columns.length + (setSelected ? 1 : 0)} >
                  No data available.
                </TableCell>
              </TableRow>
            )}

          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)} // Correct implementation
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0); // Reset to first page when rows per page changes
        }}
        className="pagination-m"
      />


      {/* Edit Dialog */}
      {editDialogOpen && (
        <EditDialog
          open={editDialogOpen}
          onClose={handleCancel}
          onSave={handleSave}
          fields={editDialogProps.getFields(editRow)}
        />
      )}
      {hasChanges && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#333",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "8px",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: 2,
            zIndex: 1000,
          }}
        >
          <Typography>Changes have been made. Save now?</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              onSave(data); // Save the changes
              alert("Changes saved successfully!");
              setHasChanges(false); // Reset changes flag
            }}
          >
            Save
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default TableWithFilters;
