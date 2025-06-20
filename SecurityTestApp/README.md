# Azure OpenAI Chat App

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
2. Set the following environment variables (in your shell or .env file):
   - AZURE_CLIENT_ID
   - AZURE_TENANT_ID
   - AZURE_CLIENT_SECRET
3. Start the development server:
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
