// Invoices API - converted from GitHub invoices.api.js

interface InvoiceNumber {
  number: number;
  organizationID: string;
}

export async function getInvoiceNum(organizationID: string, authToken: string): Promise<InvoiceNumber> {
  try {
    console.log(`Fetching invoice number for organization: ${organizationID}`);
    
    // TODO: Replace with actual API endpoint
    const response = await fetch(`/api/invoices/number/${organizationID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch invoice number: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching invoice number:', error);
    // Return fallback invoice number based on migrated data
    return { number: 37, organizationID };
  }
}

export async function updateInvoiceNum(organizationID: string, newNumber: number, authToken: string): Promise<InvoiceNumber> {
  try {
    console.log(`Updating invoice number for organization: ${organizationID} to ${newNumber}`);
    
    // TODO: Replace with actual API endpoint
    const response = await fetch(`/api/invoices/number/${organizationID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ number: newNumber }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update invoice number: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating invoice number:', error);
    throw error;
  }
}