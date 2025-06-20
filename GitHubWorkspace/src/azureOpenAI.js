import { AzureOpenAI } from "openai";
import { PublicClientApplication } from "@azure/msal-browser";

export const endpoints = [
  {
    endpoint: "https://travelcompanionai-resource.cognitiveservices.azure.com/",
    modelName: "o4-mini",
    deployment: "TravelCompanion-o4-mini",
  },
  {
    endpoint: "https://travelcompanionai-resource.cognitiveservices.azure.com/",
    modelName: "model-router",
    deployment: "TravelCompanion-model-router",
  },
];

// MSAL config
const msalConfig = {
  auth: {
    clientId: "585de4bf-5fcc-47b4-8111-dc650e6244ad",
    authority: "https://login.microsoftonline.com/330be9cd-5a6a-47db-9d51-d6060da7c8ef",
    redirectUri: window.location.origin,
  },
};
const msalInstance = new PublicClientApplication(msalConfig);
let msalInitialized = false;
const scopes = ["https://cognitiveservices.azure.com/.default"];

let accessToken = null;
let isSignedIn = false;
let signedInAccount = null;

async function chatWithAzureOpenAI(messages, selectedEndpoint) {
  if (!accessToken) {
    throw new Error("You must sign in first.");
  }

  const apiVersion = "2025-01-01-preview";
  const azureADTokenProvider = async () => accessToken;
  const options = {
    endpoint: selectedEndpoint.endpoint,
    azureADTokenProvider,
    deployment: selectedEndpoint.deployment,
    apiVersion,
  };
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
    model: selectedEndpoint.modelName,
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
  const messages = [
    { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
    ...openaiHistory,
    { role: 'user', content: userMessage },
  ];
  console.log('[OpenAI] Sending messages:', messages);
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
