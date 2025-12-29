import React from "react";
import { Box, IconButton } from "@mui/material";
import { Edit, Delete, Check } from "@mui/icons-material";

const ActionsColumn = ({ onEdit, onDelete, onApprove }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 1, // Space between buttons
    }}
  >
    {onEdit && (
      <IconButton color="primary" onClick={onEdit}>
        <Edit />
      </IconButton>
    )}
    {onDelete && (
      <IconButton color="error" onClick={onDelete}>
        <Delete />
      </IconButton>
    )}
    {onApprove && (
      <IconButton color="success" onClick={onApprove}>
        <Check />
      </IconButton>
    )}
  </Box>
);

export default ActionsColumn;
