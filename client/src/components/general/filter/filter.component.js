import React, { useState } from "react";
import {
    Box,
    FormControl,
    FormControlLabel,
    Checkbox,
    TextField,
    Typography,
    Button,
    Menu,
    MenuItem,
} from "@mui/material";

const FilterComponent = ({
    filtersConfig = [],
    onFilterChange,
    enableSearch = false,
    filteredData = [],
    columns = [],
    actions = [], // Array of custom actions: [{ name: "Action Name", onClick: () => {} }]
    onDelete,
    fileName,
    onExport
}) => {
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);

    const handleFilterChange = (field, value) => {
        const updatedFilters = { ...filters, [field]: value ? value : null }; // Set to null if unchecked
        setFilters(updatedFilters);
        onFilterChange({ ...updatedFilters, searchTerm });
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        onFilterChange({ ...filters, searchTerm: value });
    };

    const handleActionsClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleActionsClose = () => {
        setAnchorEl(null);
    };





    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "nowrap",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "10px 0",
                borderBottom: "1px solid #ddd",
                marginBottom: 2,
            }}
        >
            {enableSearch && (
                <TextField
                    label="Search"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    size="small"
                    sx={{ width: "200px" }}
                />
            )}

            {filtersConfig.map((filter) => (
                <FormControl
                    key={filter.field}
                    sx={{ flex: "0 0 auto" }}
                    size="small"
                    variant="outlined"
                >
                    {filter.type === "checkbox" ? (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!!filters[filter.field]}
                                    onChange={(e) =>
                                        handleFilterChange(filter.field, e.target.checked)
                                    }
                                />
                            }
                            label={filter.label}
                        />
                    ) : filter.type === "text" ? (
                        <TextField
                            label={filter.label}
                            variant="outlined"
                            value={filters[filter.field] || ""}
                            onChange={(e) =>
                                handleFilterChange(filter.field, e.target.value)
                            }
                            size="small"
                        />
                    ) : filter.type === "hasValue" ? (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={filters[filter.field] || false}
                                    onChange={(e) =>
                                        handleFilterChange(filter.field, e.target.checked)
                                    }
                                />
                            }
                            label={`Has ${filter.label}`}
                        />
                    ) : null}
                </FormControl>
            ))}

            <Typography variant="body2">{filteredData.length} rows match.</Typography>

            <Button
                className=" btn-cts text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
                variant="contained"
                onClick={handleActionsClick}
                size="small"
                sx={{ whiteSpace: "nowrap" }}
                
            >
                Actions
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleActionsClose}
            >
                {actions.map((action, index) => (
                    <MenuItem
                        key={index}
                        onClick={() => {
                            action.onClick();
                            handleActionsClose();
                        }}
                    >
                        {action.name}
                    </MenuItem>
                ))}
                <MenuItem
                    onClick={() => {
                        onDelete();
                        handleActionsClose();
                    }}
                >
                    Delete
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        onExport();
                        handleActionsClose();
                    }}
                >
                    Export
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default FilterComponent;
