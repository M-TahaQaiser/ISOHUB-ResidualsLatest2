import React, { useEffect, useState } from "react";
import "./agent-viewer.page.css";
import { useParams } from "react-router-dom";

// Import components
import AgentDetails from "../../../components/agents/agent-details/agent-details.component";
import AgentMerchants from "../../../components/agents/agent-merchants/agent-merchants.component";
import PartnerMerchants from "../../../components/agents/partner-merchants/partner-merchants.component";
import { getAgent, updateAgent } from "../../../api/agents.api";

const AgentViewerPage = ({ organizationID, authToken }) => {
  const { agentID } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState([]); // All clients stored here
  const [activeTab, setActiveTab] = useState("merchants"); // Track the active tab

  // Track agent form changes locally
  const [editedAgent, setEditedAgent] = useState(null);
  // Track whether unsaved changes exist
  const [hasChanges, setHasChanges] = useState(false);
  const [repSplitOnChange, setRepSplitOnChange] = useState(null);

  // console.log(editedAgent.agentSplit,'editedAgent22222');

  // Fetch agent data on mount
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await getAgent(organizationID, agentID, authToken);
        if (response.data?.success) {
          setAgent(response.data.agent);
          setEditedAgent(response.data.agent); // Initialize editable agent state
          setClients(response.data.agent.clients || []); // Store clients
        } else {
          setError("Agent not found.");
        }
      } catch (err) {
        setError("Failed to fetch agent details.");
      } finally {
        setLoading(false);
      }
    };

    if (organizationID && agentID && authToken) {
      fetchAgent();
    } else {
      setError("Missing necessary parameters.");
      setLoading(false);
    }
  }, [organizationID, agentID, authToken]);

  // Handle changes in the agent details component
  const handleAgentChange = (field, value) => {
    setEditedAgent((prev) => ({
      ...prev,
      [field]: value,
    }));
    setRepSplitOnChange(value);
    setHasChanges(true);
  };

  // Handle client changes using merchantID instead of index
  const handleClientChange = (merchantID, field, value) => {
    const updatedClients = clients.map((client) =>
      client.merchantID === merchantID ? { ...client, [field]: value } : client
    );
    setClients(updatedClients);
    setHasChanges(true);
  };

  // Handle client deletion
  const handleDeleteClient = (merchantID) => {
    const updatedClients = clients.filter(
      (client) => client.merchantID !== merchantID
    );
    setClients(updatedClients);
    setHasChanges(true);
  };

  // Function to add a new client row
  const handleAddClient = () => {
    const newClient = {
      merchantID: Date.now().toString(), // Ensure unique merchantID
      merchantName: "",
      partner: activeTab === "partners" ? "" : false,
      partnerSplit: "",
      branchID: "",
    };
    setClients([...clients, newClient]);
    setHasChanges(true);
  };

  // Handle save operation
  const handleSaveChanges = async () => {
    try {
      const updatedAgent = {
        ...editedAgent,
        clients,
      };
      const response = await updateAgent(
        organizationID,
        agentID,
        updatedAgent,
        authToken
      );
      if (response.data?.success) {
        alert("Agent and client details updated successfully!");
        setHasChanges(false);
        // Optionally, refetch the agent data to ensure the state is in sync with the backend
        const refetchedAgent = await getAgent(
          organizationID,
          agentID,
          authToken
        );
        if (refetchedAgent.data?.success) {
          setAgent(refetchedAgent.data.agent);
          setEditedAgent(refetchedAgent.data.agent);
          setClients(refetchedAgent.data.agent.clients || []);
        }
      } else {
        alert("Failed to update agent.");
      }
    } catch (err) {
      alert("Failed to update agent.");
    }
  };

  // Function to update partner clients
  const updatePartnerClients = (updatedClients) => {
    setClients(updatedClients);
    console.log(updatedClients, "updatedClients");
    setHasChanges(true);
  };

  // Split clients into two categories
  const clientsWithoutPartners = clients.filter(
    (client) => !client.partner && !client.partners
  );
  const clientsWithPartners = clients.filter(
    (client) => client.partner || client.partners
  );

  if (loading) return <div>Loading agent details...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="agent-view-page">
      <AgentDetails agent={editedAgent} onAgentChange={handleAgentChange} />

      <div className="tabs">
        <div
          className={`tab ${activeTab === "merchants" ? "active" : ""}`}
          onClick={() => setActiveTab("merchants")}
        >
          Merchants
        </div>
        <div
          className={`tab ${activeTab === "partners" ? "active" : ""}`}
          onClick={() => setActiveTab("partners")}
        >
          Partner Merchants
        </div>
      </div>

      <div className="tab-content">
        {activeTab === "merchants" ? (
          <>
            {/* Pass additional props for saving */}
            <AgentMerchants
              clients={clientsWithoutPartners}
              updateAgentClients={setClients}
              organizationID={organizationID}
              agentID={agentID}
              authToken={authToken}
              agentDetails={editedAgent}
              onClientChange={handleClientChange}
              onDeleteClient={handleDeleteClient}
            />
          </>
        ) : (
          <>
            <PartnerMerchants
              clients={clientsWithPartners}
              updatePartnerClients={updatePartnerClients}
              organizationID={organizationID} // Pass organizationID
              agentID={agentID} // Pass agentID
              authToken={authToken} // Pass authToken
              agentDetails={editedAgent}
              repSplitOnChange={repSplitOnChange} // Pass agent details
            />
          </>
        )}
      </div>

      {/* Snackbar using fixed positioning */}
      {hasChanges && (
        <div
          style={{
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
            gap: "16px",
            zIndex: 1000,
          }}
        >
          <span>Changes have been made. Save now?</span>
          <button
            style={{
              backgroundColor: "#1976d2",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={handleSaveChanges}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentViewerPage;
