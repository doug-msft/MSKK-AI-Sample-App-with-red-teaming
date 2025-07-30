// This file contains the configuration for the Azure AI Foundry project.
// Make sure to add your Entra ID Tenant ID, Client ID, and Subscription ID.
const config = {
  AZURE_TENANT_ID: "tbd",
  AZURE_CLIENT_ID: "tbd",
};

//List your project names from https://ai.azure.com
const AZURE_PROJECTS = [
  { name: 'travelcompanionai' },
  { name: "travelagent-doug365" },
  { name: "securityproject" },
  { name: "[Other...} Configure config.js file with your AI Foundry Endpoints" },
];
export { AZURE_PROJECTS };

//Fixed endpoints examples
//you can start with the AZURE_PROJECTS above, and use the admin page to list the LLM models you want to add to the list below.
export const Deployed_LLM_model_endpoints = [
  {
    endpoint_url: "https://travelcompanionai-resource.cognitiveservices.azure.com/",
    name: "TravelCompanion-o4-mini",
    modelName: "o4-mini",
    api_version: "2025-01-01-preview",
    modelPublisher: "OpenAI",
  },
  {
    endpoint_url: "https://travelcompanionai-resource.cognitiveservices.azure.com/",
    name: "TravelCompanion-model-router",
    modelName: "model-router",
    api_version: "2025-01-01-preview",
    modelPublisher: "OpenAI",
  },
    {
    endpoint_url: "https://securityproject-resource.services.ai.azure.com/models",
    name: "Mybasicapp",
    modelName: "DeepSeek-R1-0528",
    api_version: "2025-01-01-preview",
    modelPublisher: "DeepSeek",
  },
];


// Added dynamic_endpoints array to hold the output from fetchDeployments
export const dynamic_endpoints = [];

export default config;
