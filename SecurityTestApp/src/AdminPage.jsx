import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import config, { AZURE_PROJECTS } from './config';
import { handleChat, signIn, getIsSignedIn, getSignedInAccount, signOut, Deployed_LLM_model_endpoints , accessToken, obtainMultipleTokens, obtainAzureManagementToken } from './azureOpenAI';


// Ensure fetchDeployments is exported correctly and consistently
//const scope_AI = ["https://ai.azure.com/.default"].filter(entry => typeof entry === 'string' && entry.trim() !== '');

// Old version of fetchDeployments preserved for reference
/*
const fetchDeployments = async () => {
  let response;
  try {
    const { accessTokenAI } = await obtainMultipleTokens();
    const resourcename = config.AZURE_AI_PROJECT_NAME || 'travelcompanionai'; // Fallback to default if not set
    const resource = `${resourcename}-resource`; // Set resource using resourcename
    const endpoint = `https://${resource}.services.ai.azure.com/api/projects/${resourcename}/deployments?api-version=v1`;
    console.log('Using endpoint:', endpoint);
    response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessTokenAI}`,
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        console.error(`Unauthorized access to endpoint: ${endpoint}`);
        throw new Error(`Unauthorized access to endpoint. Make sure the user has permission`);
      } else if (response.status === 403) {
        console.error(`Access denied to endpoint: ${endpoint}`);
      }
      throw new Error(`Failed to fetch deployments: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format: Expected JSON');
    }
    const deployments = await response.json();
    console.log('Deployments:', deployments);
    return deployments;
  } catch (error) {
    console.error('Error fetching deployments:', error);
    throw error;
  }
};
*/

// Updated fetchDeployments to ensure deployments is set to an array
const fetchDeployments = async (selectedProject) => {
  let response;
  try {
    const { accessTokenAI } = await obtainMultipleTokens();
    const resourcename = selectedProject || 'travelcompanionai'; // Fallback to default if not set
    const resource = `${resourcename}-resource`; // Set resource using resourcename
    const endpoint = `https://${resource}.services.ai.azure.com/api/projects/${resourcename}/deployments?api-version=v1`;
    console.log('Using endpoint:', endpoint);
    response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessTokenAI}`,
      },
    });
    const data = response.ok ? await response.json() : null;
    return { status: response.status, data: data?.value || [] }; // Extract the array from the `value` property
  } catch (error) {
    console.error('Error fetching deployments:', error);
    throw error;
  }
};

// Updated fetchAzureAIProjects function to use REST API for listing Azure AI Foundry projects
const fetchAzureAIProjects = async (subscriptionId) => {
  try {
    const accessTokenManagement = await obtainAzureManagementToken(); // Obtain accessTokenManagement

    // Define the API version and filter for the request
    const apiVersion = '2024-04-01'; // Use a recent, stable API version
    const filter = "resourceType eq 'Microsoft.MachineLearningServices/workspaces' and properties.kind eq 'project'";

    // Construct the ARM REST API URL
    const url = `https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=${apiVersion}&$filter=${encodeURIComponent(filter)}`;

    console.log("Querying Azure REST API to list projects...");
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessTokenManagement}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // The list of resources is in the 'value' property
    const projects = data.value.map(resource => ({
      name: resource.name,
      id: resource.id,
      location: resource.location,
      resourceGroup: resource.id.split('/')[4], // Extract resource group name from ID
    }));

    return projects;

  } catch (error) {
    console.error("Error listing Azure AI Foundry projects via REST API:", error.message);
    throw error;
  }
};

export { fetchDeployments };

export default function AdminPage({ signedIn, userName, onSignIn, onSignOut, setStatus }) {
  const [deployments, setDeployments] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (signedIn) {
      setStatus(`Signed in as ${userName}!`);
    } else {
      setStatus('Signed out. Please sign in to start chatting.');
    }
  }, [signedIn, userName]);

  const handleFetchDeployments = async () => {
    try {
      const { status, data } = await fetchDeployments(selectedProject);
      console.log('Fetched deployments data:', data);
      if (status === 200 && Array.isArray(data)) {
        setDeployments(data);
        setStatus('Deployments fetched successfully.');
      } else {
        throw new Error('Invalid data format: Expected an array');
      }
    } catch (error) {
      setStatus(`Error fetching deployments: ${error.message}`);
    }
  };

  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
    console.log('Selected Project:', event.target.value);
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Admin Page</h1>
      </header>
      <main className="page-content">
        <div style={{ marginBottom: '16px', color: '#1976d2', fontSize: '14px', fontWeight: '500' }}>
          You need to configure the file config.js first.
        </div>

        <label htmlFor="project-dropdown">Select an Azure OpenAI project:</label>
        <select
          id="project-dropdown"
          value={selectedProject}
          onChange={handleProjectChange}
          style={{ marginBottom: '16px', padding: '8px', borderRadius: '4px' }}
          disabled={!signedIn} // Disable selection if the user is not signed in
        >
          <option value="" disabled>Select a project</option>
          {AZURE_PROJECTS.map((project, index) => (
            <option key={index} value={project.endpoint}>{project.name}</option>
          ))}
        </select>

        <div style={{ marginTop: '16px' }}>
          <button
            onClick={handleFetchDeployments}
            style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', cursor: 'pointer', marginBottom: '16px' }}
          >
            Get Azure AI Deployment Models
          </button>
        </div>

        <textarea
          style={{ width: '100%', height: '300px', overflowY: 'scroll', marginTop: '16px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          value={JSON.stringify(deployments, null, 2)}
          readOnly
        ></textarea>

        <div style={{ color: '#888', marginTop: 10 }}>
          {signedIn ? `Signed in as ${userName}` : 'Not signed in'}
        </div>

        <button
          style={{
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '0.5rem 1.2rem',
            cursor: 'pointer',
            marginTop: 16,
          }}
          onClick={() => navigate('/')}
        >
          Back to Main Page
        </button>
      </main>
    </div>
  );
}
