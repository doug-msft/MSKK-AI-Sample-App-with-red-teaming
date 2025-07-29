import { AzureOpenAI } from "openai";
import { PublicClientApplication } from "@azure/msal-browser";
import config from './config';
import { Deployed_LLM_model_endpoints } from './config';
import ModelClient from "@azure-rest/ai-inference";
import { InteractiveBrowserCredential } from "@azure/identity";

// MSAL config
const msalConfig = {
  auth: {
    clientId: config.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${config.AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
};
const msalInstance = new PublicClientApplication(msalConfig);
let msalInitialized = false;
//const scopes = ["https://ai.azure.com/.default", "https://cognitiveservices.azure.com/.default"];
const scopes = ["https://cognitiveservices.azure.com/.default"];
const scope_1 = ["https://cognitiveservices.azure.com/.default"];
const scope_2 = ["https://ai.azure.com/.default"];
const scope_3 = ["https://management.core.windows.net/"];
const scope_4 = ["https://management.azure.com/.default"];

let accessToken = null;
let accessToken_AIservices = null;
let tokenResponseAI = null;
let isSignedIn = false;
let signedInAccount = null;

async function chatWithAzureOpenAI(messages, selectedEndpoint) {
  console.log('[chatWithAzureOpenAI]1. Chat message:', messages);
  console.log('[chatWithAzureOpenAI]2. Selected Endpoint:', selectedEndpoint);
  console.log('[chatWithAzureOpenAI]3. Endpoint.URL:', selectedEndpoint.endpoint_url);
  console.log('[chatWithAzureOpenAI]4. API Version:', selectedEndpoint.api_version);
  console.log('[chatWithAzureOpenAI]5. Model Name:', selectedEndpoint.name);
  console.log('[chatWithAzureOpenAI]6. Model Publisher:', selectedEndpoint.modelPublisher);
  

  // Additional error handling for endpoint/model selection
  if (!selectedEndpoint || !selectedEndpoint.endpoint_url || !selectedEndpoint.api_version) {
    throw new Error('Invalid endpoint or model selection. Please verify your configuration.');
  }

  if (!accessToken) {
    throw new Error("You must sign in first.");
  }
  const azureADTokenProvider = async () => accessToken;
  const azureAITokenProvider = async () => accessToken_AIservices;

  // Enhanced debugging for subscription key and endpoint validation
  //console.log('[chatWithAzureOpenAI] Access Token:', accessToken);
  console.log('[chatWithAzureOpenAI] Endpoint URL:', selectedEndpoint.endpoint_url);
  console.log('[chatWithAzureOpenAI] API Version:', selectedEndpoint.api_version);

  // Validate subscription key and endpoint
  if (!accessToken) {
      throw new Error('Access token is missing or invalid. Please sign in again.');
  }
  if (!selectedEndpoint.endpoint_url || !selectedEndpoint.api_version) {
      throw new Error('Endpoint configuration is invalid. Please verify the endpoint URL and API version.');
  }


  // Check if the selectedEndpoint.modelPublisher equals 'OpenAI'
  if (selectedEndpoint.modelPublisher !== 'OpenAI') {
      console.log('Handling chat for non-OpenAI model:', selectedEndpoint.modelPublisher);
      //console.log('[chatWithAzureOpenAI] Access Token accessToken (Scope1):', accessToken);

      //const client = new ModelClient(selectedEndpoint.endpoint_url, InteractiveBrowserCredential);
      //const client = new ModelClient(selectedEndpoint.endpoint_url, new InteractiveBrowserCredential({ clientId: config.AZURE_CLIENT_ID }));
      const client = new ModelClient(selectedEndpoint.endpoint_url, accessToken);
      //console.log('[chatWithAzureOpenAI] Client created for non-OpenAI model:', client);
      console.log('[chatWithAzureOpenAI] Messages:', messages);
      console.log('[chatWithAzureOpenAI] Selected Endpoint name:', selectedEndpoint.name);
      const response = await fetch(`${selectedEndpoint.endpoint_url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          max_tokens: 2048,
          model: selectedEndpoint.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error connecting to AI endpoint');
      }

      const data = await response.json();
      console.log(data.choices[0].message.content);
      return data.choices[0].message.content;
  }

  console.log('[chatWithAzureOpenAI] Selected Model:', selectedEndpoint.name);
  console.log('[chatWithAzureOpenAI] Selected Deployment:', selectedEndpoint);


  
  const options = {
    endpoint: selectedEndpoint.endpoint_url, // Fixed to use endpoint_url
    azureADTokenProvider,
    deployment: selectedEndpoint.name,
    apiVersion: selectedEndpoint.api_version,
  };
  console.log('[chatWithAzureOpenAI] Using options:', options);
 
  const client = new AzureOpenAI(options);

  const formattedMessages = messages.map(msg => ({
    ...msg,
    content: Array.isArray(msg.content)
      ? msg.content
      : [{ type: 'text', text: msg.content }],
  }));

  const response = await client.chat.completions.create({
    messages: formattedMessages,
    max_completion_tokens: 10000,
    model: selectedEndpoint.name,
  });

  if (response?.error !== undefined && response.status !== "200") {
    throw response.error;
  }
  return response.choices[0].message.content;
}

export async function handleChat(userMessage, systemPrompt, history = [], selectedEndpoint) {
  const openaiHistory = Array.isArray(history)
    ? history.map(msg => {
        if (msg.role && msg.content) return msg;
        if (msg.sender && msg.message) {
          return {
            role: msg.sender === 'ai' ? 'assistant' : 'user',
            content: msg.message,
          };
        }
        return null;
      }).filter(Boolean)
    : [];

  // Prevent duplicate userMessage in messages array
  const isDuplicate = openaiHistory.some(msg => msg.role === 'user' && msg.content === userMessage);
  const messages = [
    { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
    ...openaiHistory,
    ...(isDuplicate ? [] : [{ role: 'user', content: userMessage }]),
  ];

  console.log('[OpenAI] Sending messages:', messages);
  console.log('[OpenAI] Sending to selected endpoint:', selectedEndpoint);
  const response = await chatWithAzureOpenAI(messages, selectedEndpoint);
  console.log('[OpenAI] Received response:', response);
  return response;
}

export async function signIn() {
  if (!msalInitialized) {
    await msalInstance.initialize();
    msalInitialized = true;
  }
  try {
    const loginResponse = await msalInstance.loginPopup({ scopes });
    const account = loginResponse.account;
    signedInAccount = account;
    msalInstance.setActiveAccount(account); // Set the active account

    const tokenResponse = await msalInstance.acquireTokenSilent({ scopes, account });
    accessToken = tokenResponse.accessToken;

    isSignedIn = true;
    return true;
  } catch (err) {
    try {
      const tokenResponse = await msalInstance.acquireTokenPopup({ scopes });
      accessToken = tokenResponse.accessToken;
      isSignedIn = true;
      const accounts = msalInstance.getAllAccounts();
      signedInAccount = accounts && accounts.length > 0 ? accounts[0] : null;
      msalInstance.setActiveAccount(signedInAccount); // Set the active account
      return true;
    } catch (popupErr) {
      accessToken = null;
      isSignedIn = false;
      signedInAccount = null;
      throw popupErr;
    }
  }
}


export async function signOut() {
  await msalInstance.logoutPopup();
  accessToken = null;
  isSignedIn = false;
  signedInAccount = null;
}

export function getSignedInAccount() {
  return signedInAccount;
}

export function getIsSignedIn() {
  return isSignedIn;
}

export { accessToken };

// Enhanced logging to capture and display request details for debugging
export async function obtainMultipleTokens() {
  if (!msalInitialized) {
    await msalInstance.initialize();
    msalInitialized = true;
  }
  const activeAccount = msalInstance.getActiveAccount();
  if (!activeAccount) {
    throw new Error('No active account set. Please sign in first.');
  }
  try {
    console.log('[get multiple tokens]Attempting to acquire tokens silently...');
    console.log('[get multiple tokens]Scopes:', { scope_1, scope_2 });
    console.log('[get multiple tokens]Active Account:', activeAccount);

    const tokenResponseOpenAI = await msalInstance.acquireTokenSilent({ scopes: scope_1, account: activeAccount });
    const tokenResponseAI = await msalInstance.acquireTokenSilent({ scopes: scope_2, account: activeAccount });
    const accessTokenOpenAI = tokenResponseOpenAI.accessToken;
    const accessTokenAI = tokenResponseAI.accessToken;

    console.log('[get multiple tokens]Tokens acquired silently:', { accessTokenOpenAI, accessTokenAI });
    return { accessTokenOpenAI, accessTokenAI };
  } catch (err) {
    console.error('Error during silent token acquisition:', err);
    if (err.errorCode === 'interaction_required') {
      console.warn('Silent token acquisition failed. Interaction required. Falling back to interactive authorization.');
      try {
        console.log('Attempting interactive token acquisition...');
        const tokenResponseOpenAI = await msalInstance.acquireTokenPopup({ scopes: scope_1 });
        const tokenResponseAI = await msalInstance.acquireTokenPopup({ scopes: scope_2 });
        const accessTokenOpenAI = tokenResponseOpenAI.accessToken;
        const accessTokenAI = tokenResponseAI.accessToken;

        console.log('Tokens acquired interactively:', { accessTokenOpenAI, accessTokenAI });
        return { accessTokenOpenAI, accessTokenAI };
      } catch (popupErr) {
        console.error('Error during interactive authorization:', popupErr);
        throw popupErr;
      }
    } else {
      console.error('Error obtaining tokens:', err);
      throw err;
    }
  }
}

export async function obtainAzureManagementToken() {
  if (!msalInitialized) {
    await msalInstance.initialize();
    msalInitialized = true;
  }
  const activeAccount = msalInstance.getActiveAccount();
  if (!activeAccount) {
    throw new Error('No active account set. Please sign in first.');
  }
  try {
    console.log('Attempting to acquire Azure Management token silently...');
    const tokenResponseManagement = await msalInstance.acquireTokenSilent({ scopes: scope_3, account: activeAccount });
    const accessTokenManagement = tokenResponseManagement.accessToken;
    console.log('Azure Management token acquired silently:', accessTokenManagement);
    return accessTokenManagement;
  } catch (err) {
    console.error('Error during silent token acquisition for Azure Management:', err);
    console.error('Error code:', err.errorCode);
    console.error('Error message:', err.errorMessage);
    if (err.errorCode === 'interaction_required') {
      console.warn('Silent token acquisition failed. Interaction required. Falling back to interactive authorization.');
      try {
        console.log('Attempting interactive token acquisition for Azure Management...');
        const tokenResponseManagement = await msalInstance.acquireTokenPopup({ scopes: scope_3 });
        const accessTokenManagement = tokenResponseManagement.accessToken;
        console.log('Azure Management token acquired interactively:', accessTokenManagement);
        return accessTokenManagement;
      } catch (popupErr) {
        console.error('Error during interactive authorization for Azure Management:', popupErr);
        throw popupErr;
      }
    } else {
      console.error('Error obtaining Azure Management token:', err);
      throw err;
    }
  }
}

export { Deployed_LLM_model_endpoints };

// Ensure obtainMultipleTokens is properly exported
//export { obtainMultipleTokens };
