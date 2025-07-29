# Check Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed. Please install it from https://nodejs.org/"
    Start-Process "https://nodejs.org/" -UseShellExecute
    exit
} else {
    Write-Host "Node.js is installed."
}

# Check npm
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed. Please install Node.js from https://nodejs.org/"
    Start-Process "https://nodejs.org/" -UseShellExecute
    exit
} else {
    Write-Host "npm is installed."
}

# Check Git
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Host "Git is not installed. Please install it from https://git-scm.com/"
    Start-Process "https://git-scm.com/" -UseShellExecute
    exit
} else {
    Write-Host "Git is installed."
}

# Check Azure CLI
if (-not (Get-Command "az" -ErrorAction SilentlyContinue)) {
    Write-Host "Azure CLI is not installed. Please install it from https://aka.ms/installazurecliwindows"
    Start-Process "https://aka.ms/installazurecliwindows" -UseShellExecute
    exit
} else {
    Write-Host "Azure CLI is installed."
}

# Check Environment Variables
$requiredEnvVars = @("AZURE_CLIENT_ID", "AZURE_TENANT_ID")
foreach ($var in $requiredEnvVars) {
    if (-not $env:$var) {
        Write-Host "Environment variable $var is not set. Please set it before running the application."
        exit
    } else {
        Write-Host "Environment variable $var is set."
    }
}

Write-Host "All pre-requisites are met. You can now run the application."