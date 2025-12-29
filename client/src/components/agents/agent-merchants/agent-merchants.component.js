import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from "@mui/material";
import TableWithFilters from "../../general/table/table.component";
import { updateAgent } from "../../../api/agents.api";

const AgentMerchants = ({
  clients,
  updateAgentClients,
  organizationID,
  agentID,
  authToken,
  agentDetails,
  onClientChange,
  onDeleteClient,
}) => {
  // Local state holds only agent merchants (non-partner)
  const [agentData, setAgentData] = useState([]);
  const [selected, setSelected] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Modal state and form data for adding a new merchant
  const [openModal, setOpenModal] = useState(false);
  const [newMerchant, setNewMerchant] = useState({
    merchantID: "",
    merchantName: "",
    partner: false,
    branchID: "",
    agentSplit: "",
  });

  // Update local agent data whenever the parent's clients change.
  // (Only non-partner merchants are shown here.)
  useEffect(() => {
    console.log('clients',clients);
    const filtered = clients.filter((client) => !client.partner);
    setAgentData(filtered);
  }, [clients]);

  // Open the add merchant modal and reset the form values.
  const handleOpenModal = () => {
    setNewMerchant({
      merchantID: "",
      merchantName: "",
      partner: false,
      branchID: "",
      agentSplit: agentDetails.agentSplit || "0%",
    });
    setOpenModal(true);
  };

  // Close the modal without adding a merchant.
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Add the new merchant from the modal form.
  const handleAddNewMerchant = async () => {
    try {
      // If no merchant ID is provided, generate a temporary one using Date.now().
      const newMerchantWithID = {
        ...newMerchant,
        merchantID: newMerchant.merchantID || Date.now().toString(),
        agentSplit: newMerchant.agentSplit || agentDetails.agentSplit || "0%",
      };

      // Get existing partner clients and non-partner clients
      const partnerClients = (agentDetails.clients || []).filter(
        (client) => client.partner
      );
      const existingNonPartnerClients = (agentDetails.clients || []).filter(
        (client) => !client.partner
      );

      // Combine all clients: existing non-partner clients + partner clients + new merchant
      const updatedClients = [
        ...existingNonPartnerClients,
        ...partnerClients,
        newMerchantWithID,
      ];

      // Set hasChanges to true to show confirmation dialog
      setHasChanges(true);

      // Update local state immediately to show the new merchant
      setAgentData((prev) => [...prev, newMerchantWithID]);
      setOpenModal(false);
    } catch (err) {
      alert("Failed to add merchant.");
    }
  };

  // onSave callback from TableWithFilters.
  // Merge updated agent data with the partner clients, then update the parent.
  // const handleSave = async (updatedData) => {
  //   try {
  //     // Get existing partner clients
  //     const partnerClients = (agentDetails.clients || []).filter(
  //       (client) => client.partner
  //     );

  //     // Combine partner clients with updated merchant data
  //     const updatedClients = [...partnerClients, ...updatedData];

  //     console.log('updatedData',updatedData);
  //     console.log('updatedClients',updatedClients);

  //     // Update the agent with new clients
  //     const updatedAgent = { ...agentDetails, clients: updatedClients };

  //     const response = await updateAgent(
  //       organizationID,
  //       agentID,
  //       updatedAgent,
  //       authToken
  //     );

  //     if (response.data?.success) {
  //       updateAgentClients(updatedClients);
  //       setHasChanges(false);
  //     } else {
  //       alert("Failed to save merchants.");
  //     }
  //   } catch (err) {
  //     alert("Failed to save merchants.");
  //   }
  // };

  const handleSave = async (updatedData) => {
  try {
    // Get existing partner clients (those with .partner or .partners)
    const partnerClients = (agentDetails.clients || []).filter(
      (client) => client.partner || client.partners
    );

    // Combine partner clients with updated merchant data
    const updatedClients = [...updatedData, ...partnerClients];

    // Update the agent with new clients
    const updatedAgent = { ...agentDetails, clients: updatedClients };

    // console.log('updatedAgent',updatedAgent);
    // return false;

    const response = await updateAgent(
      organizationID,
      agentID,
      updatedAgent,
      authToken
    );

    if (response.data?.success) {
      updateAgentClients(updatedClients);
      setHasChanges(false);
    } else {
      alert("Failed to save merchants.");
    }
  } catch (err) {
    alert("Failed to save merchants.");
  }
};

  // Define the columns for the agent merchants table.
  const columns = [
    { field: "merchantID", label: "Merchant ID", type: "text" },
    { field: "merchantName", label: "Merchant Name", type: "text" },
    {
      field: "agentSplit",
      label: "Agent Split",
      type: "text",
      render: (value) => value || agentDetails.agentSplit || "0%",
      defaultValue: agentDetails.agentSplit || "0%",
    },
  ];

  // Define the actions dropdown items.
  // In this case, we only have the "Add Merchant" action.
  const actions = [
    {
      name: "Add Merchant",
      onClick: handleOpenModal,
    },
  ];

  // Add validation function for agent split
  const handleAgentSplitChange = (e) => {
    const value = e.target.value;
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");

    // If empty, set empty string to use default
    if (numericValue === "") {
      setNewMerchant({ ...newMerchant, agentSplit: "" });
      return;
    }

    // Convert to number and ensure it's between 0 and 100
    const numValue = parseFloat(numericValue);
    if (numValue >= 0 && numValue <= 100) {
      setNewMerchant({ ...newMerchant, agentSplit: `${numValue}%` });
    }
  };

  return (
    <div>
      {/* Modal Dialog for Adding an Agent Merchant */}
      <Dialog
        class=" add-agent-merchant bg-zinc-900 rounded-lg shadow-sm p-6 mb-8"
        open={openModal}
        onClose={handleCloseModal}
      >
        <DialogTitle>Add Agent Merchant</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Merchant ID"
            type="text"
            fullWidth
            variant="outlined"
            value={newMerchant.merchantID}
            onChange={(e) =>
              setNewMerchant({ ...newMerchant, merchantID: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Merchant Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newMerchant.merchantName}
            onChange={(e) =>
              setNewMerchant({ ...newMerchant, merchantName: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Agent Split"
            type="text"
            fullWidth
            variant="outlined"
            placeholder={agentDetails.agentSplit || "0%"}
            value={newMerchant.agentSplit}
            onChange={handleAgentSplitChange}
            helperText="Enter a number between 0 and 100. Leave empty to use agent's default split"
            inputProps={{
              pattern: "[0-9.]*",
              inputMode: "numeric",
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} className="text-yellow-400 cncl">
            Cancel
          </Button>
          <Button
            onClick={handleAddNewMerchant}
            className="cncl-btn  primary text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reusable Table with Filters */}
      <TableWithFilters
        data={agentData}
        setData={setAgentData}
        idField="merchantID"
        columns={columns}
        enableSearch={true}
        selected={selected}
        setSelected={setSelected}
        // Setting approvalAction to true renders an actions column (for editing/deleting)
        approvalAction={true}
        fileName="agent_merchants.csv"
        hasChanges={hasChanges}
        setHasChanges={setHasChanges}
        onSave={handleSave}
        totalFields={[]} // Add field keys here if you need totals for any numeric columns
        actions={actions} // Pass the actions dropdown items to the table
        onDelete={(merchantID) => {
          onDeleteClient(merchantID);
          setAgentData((prev) =>
            prev.filter((client) => client.merchantID !== merchantID)
          );
        }}
        editDialogProps={{
          getFields: (row) =>
            columns.map((col) => ({
              label: col.label,
              field: col.field,
              type:
                col.type ||
                (typeof row?.[col.field] === "boolean" ? "boolean" : "text"),
              defaultValue: row?.[col.field] || col.defaultValue || "",
              handleInputChange: (field, value) => {
                if (field === "agentSplit") {
                  const numericValue = value.replace(/[^0-9.]/g, "");
                  if (numericValue === "") {
                    return "";
                  }
                  const numValue = parseFloat(numericValue);
                  if (numValue >= 0 && numValue <= 100) {
                    return `${numValue}%`;
                  }
                  return value;
                }
                return value;
              },
            })),
        }}
        merchantPartnerSlug="merchantPartnerSlug"
      />
    </div>
  );
};

export default AgentMerchants;
