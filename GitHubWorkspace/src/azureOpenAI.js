
import { AzureOpenAI } from "openai";
import { PublicClientApplication } from "@azure/msal-browser";


const endpoint = "https://travelcompanionai-resource.cognitiveservices.azure.com/"; // e.g. https://your-resource-name.openai.azure.com/
const modelName = "o4-mini"; // e.g. gpt-4, o4-mini
const deployment = "TravelCompanion-o4-mini"; // e.g. my-deployment


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



async function chatWithAzureOpenAI(messages) {
  if (!accessToken) {
    throw new Error("You must sign in first.");
  }

  const apiVersion = "2025-01-01-preview";
  // Provide a token provider function as required by the SDK
  const azureADTokenProvider = async () => accessToken;
  const options = {
    endpoint,
    azureADTokenProvider,
    deployment,
    apiVersion,
  };
  const client = new AzureOpenAI(options);

  const response = await client.chat.completions.create({
    messages,
    max_completion_tokens: 1000,
    model: modelName,
  });

  if (response?.error !== undefined && response.status !== "200") {
    throw response.error;
  }
  return response.choices[0].message.content;
}


export async function handleChat(userMessage, history) {
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    ...history,
    { role: "user", content: userMessage },
  ];
  return await chatWithAzureOpenAI(messages);
}


export async function signIn() {
  if (!msalInitialized) {
    await msalInstance.initialize();
    msalInitialized = true;
  }
  try {
    const loginResponse = await msalInstance.loginPopup({ scopes });
    const account = loginResponse.account;
    const tokenResponse = await msalInstance.acquireTokenSilent({ scopes, account });
    accessToken = tokenResponse.accessToken;
    isSignedIn = true;
    return true;
  } catch (err) {
    // fallback to interactive if silent fails
    try {
      const tokenResponse = await msalInstance.acquireTokenPopup({ scopes });
      accessToken = tokenResponse.accessToken;
      isSignedIn = true;
      return true;
    } catch (popupErr) {
      accessToken = null;
      isSignedIn = false;
      throw popupErr;
    }
  }
}

export function getIsSignedIn() {
  return isSignedIn;
}
