// Test ISO-AI Integration with Replit Database
console.log('Testing ISO-AI Integration with Replit Database...');

// Test basic API endpoints
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:5000';
  const organizationId = 'org-86f76df1'; // Test organization from your ISO-AI system
  
  try {
    // Test 1: Get agents for organization
    console.log('\n1. Testing GET /api/agents/:organizationId');
    const agentsResponse = await fetch(`${baseUrl}/api/agents/${organizationId}`);
    const agentsData = await agentsResponse.json();
    console.log('Agents Response:', agentsData);
    
    // Test 2: Get dashboard metrics
    console.log('\n2. Testing GET /api/dashboard/:organizationId/metrics');
    const metricsResponse = await fetch(`${baseUrl}/api/dashboard/${organizationId}/metrics`);
    const metricsData = await metricsResponse.json();
    console.log('Metrics Response:', metricsData);
    
    // Test 3: Create a test agent
    console.log('\n3. Testing POST /api/agents/:organizationId (Create Agent)');
    const newAgent = {
      firstName: 'Test',
      lastName: 'Agent',
      company: 'Test Company',
      manager: 'Test Manager',
      userId: 'test_user_123'
    };
    
    const createResponse = await fetch(`${baseUrl}/api/agents/${organizationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newAgent)
    });
    
    const createData = await createResponse.json();
    console.log('Create Agent Response:', createData);
    
    if (createData.acknowledged) {
      const agentId = createData.agentId;
      
      // Test 4: Get specific agent
      console.log('\n4. Testing GET /api/agents/:organizationId/:agentId');
      const agentResponse = await fetch(`${baseUrl}/api/agents/${organizationId}/${agentId}`);
      const agentData = await agentResponse.json();
      console.log('Get Agent Response:', agentData);
      
      // Test 5: Update agent
      console.log('\n5. Testing PUT /api/agents/:organizationId/:agentId (Update Agent)');
      const updateData = {
        company: 'Updated Test Company',
        manager: 'Updated Manager'
      };
      
      const updateResponse = await fetch(`${baseUrl}/api/agents/${organizationId}/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      const updatedAgent = await updateResponse.json();
      console.log('Update Agent Response:', updatedAgent);
      
      // Test 6: Delete agent (cleanup)
      console.log('\n6. Testing DELETE /api/agents/:organizationId/:agentId');
      const deleteResponse = await fetch(`${baseUrl}/api/agents/${organizationId}/${agentId}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.status === 204) {
        console.log('Delete Agent: Success (204)');
      } else {
        const deleteData = await deleteResponse.json();
        console.log('Delete Agent Response:', deleteData);
      }
    }
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
};

// Run tests after a short delay to ensure server is running
setTimeout(testEndpoints, 2000);