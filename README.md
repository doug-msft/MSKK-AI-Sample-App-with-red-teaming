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
2. Deploy at least two LLM models in Azure AI Foundry, and capture the deployment information such as:
    - endpoint_url: "<Replace_with_URL>",
    - name: "<Name_of_Deployment>",
    - modelName: "o4-mini",
    - api_version: "2025-01-01-preview",
    - modelPublisher: "OpenAI"
*The reason to have at least two LLM models, is so you can have different Azure Content Safety filters for each LLM to demo different use cases*

3. Give user access to the LLM apps 
*This step is only needed if testing with regular users, if you test with the owner of the LLM app, this step is not needed*

4. Create an App in Entra ID to authenticate as the user, and capture the App client ID and Entra Tenant ID.

5. Set the following environment variables (in the config.js file):
   - AZURE_CLIENT_ID (This is the Client ID of the App you created to authenticate as the user)
   - AZURE_TENANT_ID (This is your Entra ID tenant ID)
   - AZURE_PROJECTS (List the project names of your Azure AI Foundry projects)
   - Deployed_LLM_model_endpoints (list the detail information about your LLM models deployed in Azure AI Foundry)

6. Start the development server:
*From Powershell navigate to the folder where the App is stored and run:*
   ```sh
   npm run dev
   ```
