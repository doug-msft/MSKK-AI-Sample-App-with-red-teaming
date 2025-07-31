# Azure OpenAI Chat App V2.0

This is a Vite-based JavaScript web app with a chat interface that authenticates to Entra ID (Azure AD) using @azure/identity and connects to Azure OpenAI.

## Features
- Azure AD authentication using DefaultAzureCredential
- Connects to Azure OpenAI for chat completions
- Simple web-based chat UI
- Ready for Azure deployment

## Getting Started
1. Download and run the PS script to check and install dependencies, and clone the app files locally:
   ```sh
   Install-prerequisites.ps1
   ```
2. Deploy at least two LLM models in Azure AI Foundry, and capture the deployment information such as 
    - endpoint_url: "<Replace_with_URL>",
    - name: "<Name_of_Deployment>",
    - modelName: "o4-mini",
    - api_version: "2025-01-01-preview",
    - modelPublisher: "OpenAI"

3. Give user access to the LLM apps

3. Create an App in Entra ID to authenticate as the user, and capture the App client ID and Entra Tenant ID.

3. Set the following environment variables (in the config.js file):
   - AZURE_CLIENT_ID
   - AZURE_TENANT_ID

4. Start the development server:
   ```sh
   npm run dev
   ```

## Deployment
- Follow Azure best practices for authentication and deployment.
- You can deploy this app to Azure Static Web Apps, Azure App Service, or other Azure hosting options.

## Customization
- Update the Azure OpenAI endpoint, deployment, and model in the source code as needed.

---

For more details, see the Azure OpenAI and @azure/identity documentation.
