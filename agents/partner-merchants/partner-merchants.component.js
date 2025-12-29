import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Typography } from '@mui/material';
import TableWithFilters from '../../general/table/table.component';
import { updateAgent } from '../../../api/agents.api'; // using same updateAgent API

const PartnerMerchants = ({ 
  clients, 
  updatePartnerClients,
  organizationID,
  agentID,
  authToken,
  agentDetails, // full agent object from parent
  repSplitOnChange
}) => {
  const [partnerData, setPartnerData] = useState([]);
  const [selected, setSelected] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [newMerchant, setNewMerchant] = useState({
    merchantID: '',
    merchantName: '',
    partner: '',
    partnerSplit: '',
    partners: [{ name: '', split: '' }], // Array of partners with their splits
    reps: [{ name: '', split: '' }], // Add reps array
    branchID: ''
  });

  useEffect(() => {
    const filtered = clients.filter(client => client.partner || client.partners);
    setPartnerData(filtered);
  }, [clients]);

  const handleOpenModal = () => {
    setNewMerchant({
      merchantID: '',
      merchantName: '',
      partner: '',
      partnerSplit: '',
      partners: [{ name: '', split: '' }],
      reps: [{ name: '', split: '' }],
      branchID: ''
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Add a new partner row
  const handleAddPartner = () => {
    setNewMerchant(prev => ({
      ...prev,
      partners: [...prev.partners, { name: '', split: '' }]
    }));
  };

  // Remove a partner row
  const handleRemovePartner = (index) => {
    setNewMerchant(prev => ({
      ...prev,
      partners: prev.partners.filter((_, i) => i !== index)
    }));
  };

  // Update partner name or split
  const handlePartnerChange = (index, field, value) => {
    setNewMerchant(prev => ({
      ...prev,
      partners: prev.partners.map((partner, i) => 
        i === index ? { ...partner, [field]: value } : partner
      )
    }));
  };

  // Add a new rep row
  const handleAddRep = () => {
    setNewMerchant(prev => ({
      ...prev,
      reps: [...prev.reps, { name: '', split: '' }]
    }));
  };

  // Remove a rep row
  const handleRemoveRep = (index) => {
    setNewMerchant(prev => ({
      ...prev,
      reps: prev.reps.filter((_, i) => i !== index)
    }));
  };

  // Update rep name or split
  const handleRepChange = (index, field, value) => {
    setNewMerchant(prev => ({
      ...prev,
      reps: prev.reps.map((rep, i) => 
        i === index ? { ...rep, [field]: value } : rep
      )
    }));
  };

  // Add validation function for partner split
  const handlePartnerSplitChange = (index, value) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // If empty, set empty string
    if (numericValue === '') {
      handlePartnerChange(index, 'split', '');
      return;
    }

    // Convert to number and ensure it's between 0 and 100
    const numValue = parseFloat(numericValue);
    if (numValue >= 0 && numValue <= 100) {
      handlePartnerChange(index, 'split', `${numValue}%`);
    }
  };

  // Add validation function for rep split
  const handleRepSplitChange = (index, value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    if (numericValue === '') {
      handleRepChange(index, 'split', '');
      return;
    }

    const numValue = parseFloat(numericValue);
    if (numValue >= 0 && numValue <= 100) {
      handleRepChange(index, 'split', `${numValue}%`);
    }
  };

  const handleAddNewMerchant = () => {
    // Validate partners and reps have valid splits if they exist
    const isValidPartners = newMerchant.partners.every(partner => 
      (partner.name.trim() === '' && partner.split === '') || // Empty partner is valid
      (partner.name.trim() !== '' && 
        (partner.split === '' || (parseFloat(partner.split.replace('%', '')) >= 0 && parseFloat(partner.split.replace('%', '')) <= 100)))
    );

    const isValidReps = newMerchant.reps.every(rep => 
      (rep.name.trim() === '' && rep.split === '') || // Empty rep is valid
      (rep.name.trim() !== '' && 
        (rep.split === '' || (parseFloat(rep.split.replace('%', '')) >= 0 && parseFloat(rep.split.replace('%', '')) <= 100)))
    );

    if (!isValidPartners || !isValidReps) {
      alert('Please ensure all partner/rep splits are between 0 and 100');
      return;
    }

    // Filter out empty partners and reps
    const filteredPartners = newMerchant.partners.filter(partner => 
      partner.name.trim() !== '' || partner.split !== ''
    );
    const filteredReps = newMerchant.reps.filter(rep => 
      rep.name.trim() !== '' || rep.split !== ''
    );

    const newMerchantWithID = {
      ...newMerchant,
      merchantID: newMerchant.merchantID || Date.now().toString(),
      partners: filteredPartners.map(partner => ({
        ...partner,
        split: partner.split ? (partner.split.includes('%') ? partner.split : `${partner.split}%`) : '0%'
      })),
      reps: filteredReps.map(rep => ({
        ...rep,
        split: rep.split ? (rep.split.includes('%') ? rep.split : `${rep.split}%`) : '0%'
      })),
      totalRepsSplitCount: (filteredReps.reduce((total, rep) => {
        const splitValue = rep.split ? parseFloat(rep.split.replace('%', '')) : 0;
        return total + splitValue;
      }, 0) + (parseFloat(agentDetails.agentSplit.replace('%', '')) > 0 ? parseFloat(agentDetails.agentSplit.replace('%', '')) : 0)).toString()  // Convert number to string
    };

    updatePartnerClients(prev => [...prev, newMerchantWithID]);
    setHasChanges(true);
    setOpenModal(false);
  };

  // Global save function adapted for use via TableWithFilters.
  // It now accepts updatedData from the table's snackbar.
  const handleSavePartner = async (updatedData) => {
    try {
      console.log('updatedData',updatedData);
      // Calculate totalRepsSplitCount for each merchant
      const updatedDataWithTotal = updatedData.map(merchant => {
        const totalRepsSplitCount = merchant.reps.reduce((total, rep) => {
          const splitValue = rep.split ? parseFloat(rep.split.replace('%', '')) : 0;
          return total + splitValue;
        }, 0) + (parseFloat(agentDetails.agentSplit.replace('%', '')) > 0 ? parseFloat(agentDetails.agentSplit.replace('%', '')) : 0);

        return {
          ...merchant,
          totalRepsSplitCount: totalRepsSplitCount.toString()
        };
      });

      // Get existing non-partner clients
      const nonPartnerClients = (agentDetails.clients || []).filter(client => !client.partner && !client.partners);
      const updatedClients = [...nonPartnerClients, ...updatedDataWithTotal];
      const updatedAgent = { ...agentDetails, clients: updatedClients };

      // console.log('updatedAgent',updatedAgent);
      // return false;
      
      const response = await updateAgent(organizationID, agentID, updatedAgent, authToken);
      if(response.data?.success) {
        setHasChanges(false);
      } else {
        alert('Failed to save partner merchants.');
      }
    } catch (err) {
      alert('Failed to save partner merchants.');
    }
  };

  const columns = [
    { field: "merchantID", label: "Merchant ID", type: "text" },
    { field: "merchantName", label: "Merchant Name", type: "text" },
    { 
      field: "partners", 
      label: "Number of Partners", 
      type: "text",
      render: (value, row) => {
        // Handle old format (single partner)
        if (row.partner) {
          return "1";
        }
        // Handle new format (multiple partners)
        if (row.partners && Array.isArray(row.partners)) {
          return row.partners.length.toString();
        }
        return "0";
      }
    },
    { 
      field: "partners", 
      label: "Total Partner Split (%)", 
      type: "text",
      render: (value, row) => {
        // Handle old format (single partner)
        if (row.partner) {
          return row.partnerSplit || "0%";
        }
        // Handle new format (multiple partners)
        if (row.partners && Array.isArray(row.partners)) {
          const totalSplit = row.partners.reduce((sum, partner) => {
            // Handle both string and number values for split
            const splitValue = typeof partner.split === 'string' 
              ? parseFloat(partner.split.replace('%', ''))
              : partner.split;
            return sum + (splitValue || 0);
          }, 0);
          return `${totalSplit}%`;
        }
        return "0%";
      }
    },
    { 
      field: "reps", 
      label: "Number of Reps", 
      type: "text",
      render: (value, row) => {
        if (row.reps && Array.isArray(row.reps)) {
          return row.reps.length.toString();
        }
        return "0";
      }
    },

    {
      field: "reps",
      label: "Total Rep Split (%)",
      type: "text",
      render: (value, row) => {
        // if (row.totalRepsSplitCount) {
        //   const agentSplit = parseFloat(agentDetails.agentSplit.replace('%', '')) || 0;
        //   const totalSplit = parseFloat(row.totalRepsSplitCount) + agentSplit;
        //   return `${totalSplit}%`;
        // }
        // If totalRepsSplitCount doesn't exist, calculate it from reps
        if (row.reps && Array.isArray(row.reps)) {
          const totalSplit = row.reps.reduce((sum, rep) => {
            const splitValue = typeof rep.split === 'string' 
              ? parseFloat(rep.split.replace('%', ''))
              : rep.split;
            return sum + (splitValue || 0);
          }, 0);
          
          let agentSplit = parseFloat(agentDetails.agentSplit.replace('%', ''));
          if (Number.isNaN(agentSplit)) {
            agentSplit = 0;
          }
        
          console.log(agentSplit, 'agentSplit');
          console.log(totalSplit, 'totalSplit');
          return `${totalSplit + agentSplit}%`;
        }
        return "0%";
      }
    },

    { field: "branchID", label: "Branch ID", type: "text" },
  ];

  // Custom edit dialog fields for partners and reps
  const getEditDialogFields = (row) => {
    // Filter out both partners and reps columns from base fields
    const baseFields = columns
      .filter(col => col.field !== "partners" && col.field !== "reps")
      .map(col => ({
        label: col.label,
        field: col.field,
        type: col.type || "text",
        defaultValue: row[col.field] || "",
      }));

    // Add partner fields based on data format
    if (row.partner) {
      // Old format - single partner
      baseFields.push(
        {
          label: "Partner Name",
          field: "partner",
          type: "text",
          defaultValue: row.partner || "",
        },
        {
          label: "Partner Split (%)",
          field: "partnerSplit",
          type: "text",
          defaultValue: row.partnerSplit || "0%",
        }
      );
    } else if (row.partners && Array.isArray(row.partners)) {
      // New format - multiple partners
      baseFields.push({
        label: "Partners",
        field: "partners",
        type: "custom",
        defaultValue: row.partners || [],
        component: ({ value = [], onChange }) => (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Typography variant="subtitle1">Partners</Typography>
              <Button 
                size="small" 
                onClick={() => {
                  const newPartners = [...value, { name: '', split: '' }];
                  onChange(newPartners);
                }}
                variant="outlined"
                color="primary"
              >
                Add Partner
              </Button>
            </div>
            
            {(value || []).map((partner, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <TextField
                  margin="dense"
                  label="Partner Name"
                  type="text"
                  style={{ width: '70%' }}
                  variant="outlined"
                  value={partner.name || ''}
                  onChange={(e) => {
                    const newPartners = [...value];
                    newPartners[index] = { ...partner, name: e.target.value };
                    onChange(newPartners);
                  }}
                />
                <TextField
                  margin="dense"
                  label="Split (%)"
                  type="text"
                  style={{ width: '30%' }}
                  variant="outlined"
                  value={partner.split || ''}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                    if (numericValue === '') {
                      const newPartners = [...value];
                      newPartners[index] = { ...partner, split: '' };
                      onChange(newPartners);
                      return;
                    }
                    const numValue = parseFloat(numericValue);
                    if (numValue >= 0 && numValue <= 100) {
                      const newPartners = [...value];
                      newPartners[index] = { ...partner, split: `${numValue}%` };
                      onChange(newPartners);
                    }
                  }}
                  helperText="0-100"
                  inputProps={{ 
                    pattern: "[0-9.]*",
                    inputMode: "numeric"
                  }}
                />
                <Button
                  size="small"
                  className='remove-btn'
                  onClick={() => {
                    const newPartners = value.filter((_, i) => i !== index);
                    onChange(newPartners);
                  }}
                  color="error"
                  style={{ marginTop: '8px' }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )
      });
    }

    // Add reps section
    baseFields.push({
      label: "Reps",
      field: "reps",
      type: "custom",
      defaultValue: row.reps || [],
      component: ({ value = [], onChange }) => (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Typography variant="subtitle1">Reps</Typography>
            <Button 
              size="small" 
              onClick={() => {
                const newReps = [...value, { name: '', split: '' }];
                onChange(newReps);
              }}
              variant="outlined"
              color="primary"
            >
              Add Rep
            </Button>
          </div>
          
          {(value || []).map((rep, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <TextField
                margin="dense"
                label="Rep Name"
                type="text"
                style={{ width: '70%' }}
                variant="outlined"
                value={rep.name || ''}
                onChange={(e) => {
                  const newReps = [...value];
                  newReps[index] = { ...rep, name: e.target.value };
                  onChange(newReps);
                }}
              />
              <TextField
                margin="dense"
                label="Split (%)"
                type="text"
                style={{ width: '30%' }}
                variant="outlined"
                value={rep.split || ''}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                  if (numericValue === '') {
                    const newReps = [...value];
                    newReps[index] = { ...rep, split: '' };
                    onChange(newReps);
                    return;
                  }
                  const numValue = parseFloat(numericValue);
                  if (numValue >= 0 && numValue <= 100) {
                    const newReps = [...value];
                    newReps[index] = { ...rep, split: `${numValue}%` };
                    onChange(newReps);
                  }
                }}
                helperText="0-100"
                inputProps={{ 
                  pattern: "[0-9.]*",
                  inputMode: "numeric"
                }}
              />
              <Button
                size="small"
                className='remove-btn'
                onClick={() => {
                  const newReps = value.filter((_, i) => i !== index);
                  onChange(newReps);
                }}
                color="error"
                style={{ marginTop: '8px' }}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )
    });

    return baseFields;
  };

  // Custom input change handler for partner and rep fields
  const handlePartnerInputChange = (field, value, row) => {
    if (field === 'partners') {
      return { ...row, partners: value };
    } else if (field === 'reps') {
      return { ...row, reps: value };
    } else if (field === 'partner' || field === 'partnerSplit') {
      return { ...row, [field]: value };
    }
    return { ...row, [field]: value };
  };

  const actions = [
    {
      name: 'Add Merchant',
      onClick: handleOpenModal,
    }
  ];

  return (
    <div>
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Add Partner Merchant</DialogTitle>
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
          
          {/* Partners Section */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Typography variant="subtitle1">Partners</Typography>
              <Button 
                size="small" 
                className='add-btn'
                onClick={handleAddPartner}
                variant="outlined"
                color="primary"
              >
                Add Partner
              </Button>
            </div>
            
            {newMerchant.partners.map((partner, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <TextField
                  margin="dense"
                  label="Partner Name"
                  type="text"
                  style={{ width: '70%' }}
                  variant="outlined"
                  value={partner.name}
                  onChange={(e) => handlePartnerChange(index, 'name', e.target.value)}
                />
                <TextField
                  margin="dense"
                  label="Split (%)"
                  type="text"
                  style={{ width: '30%' }}
                  variant="outlined"
                  value={partner.split}
                  onChange={(e) => handlePartnerSplitChange(index, e.target.value)}
                  helperText="0-100"
                  inputProps={{ 
                    pattern: "[0-9.]*",
                    inputMode: "numeric"
                  }}
                />
                <Button
                  size="small"
                  className='remove-btn'
                  onClick={() => handleRemovePartner(index)}
                  color="error"
                  style={{ marginTop: '8px' }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Reps Section */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Typography variant="subtitle1">Reps</Typography>
              <Button 
                size="small" 
                className='add-btn'
                onClick={handleAddRep}
                variant="outlined"
                color="primary"
              >
                Add Rep
              </Button>
            </div>
            
            {newMerchant.reps.map((rep, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <TextField
                  margin="dense"
                  label="Rep Name"
                  type="text"
                  style={{ width: '70%' }}
                  variant="outlined"
                  value={rep.name}
                  onChange={(e) => handleRepChange(index, 'name', e.target.value)}
                />
                <TextField
                  margin="dense"
                  label="Split (%)"
                  type="text"
                  style={{ width: '30%' }}
                  variant="outlined"
                  value={rep.split}
                  onChange={(e) => handleRepSplitChange(index, e.target.value)}
                  helperText="0-100"
                  inputProps={{ 
                    pattern: "[0-9.]*",
                    inputMode: "numeric"
                  }}
                />
                <Button
                  size="small"
                  className='remove-btn'
                  onClick={() => handleRemoveRep(index)}
                  color="error"
                  style={{ marginTop: '8px' }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <TextField
            margin="dense"
            label="Branch ID"
            type="text"
            fullWidth
            variant="outlined"
            value={newMerchant.branchID}
            onChange={(e) =>
              setNewMerchant({ ...newMerchant, branchID: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleAddNewMerchant} 
            color="primary"
            disabled={!newMerchant.merchantID || !newMerchant.merchantName || 
              (newMerchant.partners.length === 0 && newMerchant.reps.length === 0)}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <TableWithFilters
        data={partnerData}
        setData={setPartnerData}
        idField="merchantID"
        columns={columns}
        enableSearch={true}
        selected={selected}
        setSelected={setSelected}
        approvalAction={true}
        fileName="partner_merchants.csv"
        hasChanges={hasChanges}
        setHasChanges={setHasChanges}
        onSave={handleSavePartner}
        totalFields={[]}
        actions={actions}
        editDialogProps={{
          getFields: getEditDialogFields,
          handleInputChange: handlePartnerInputChange
        }}
        agentDetails={agentDetails}
        merchantPartnerSlug='merchantPartnerSlug'
      />
    </div>
  );
};

export default PartnerMerchants;
