# Azure OpenAI Chat App V2.0

This is a Vite-based JavaScript web app with a chat interface that authenticates to Entra ID (Azure AD) using @azure/identity and connects to Azure OpenAI.

## Features
- Azure AD authentication using DefaultAzureCredential
- Connects to Azure OpenAI for chat completions
- Simple web-based chat UI
- Ready for Azure deployment

## Getting Started
1. Install dependencies:
   ```sh
   npm install
   ```
2. Set the following environment variables (in the config.js file):
   - AZURE_CLIENT_ID
   - AZURE_TENANT_ID

3. Make sure you have the pre-requisites installed on your machine
   - You can run the 

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
