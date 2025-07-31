# Check pre-requisites and install if necessary (Version 2.0)
# Prompt the user before proceeding
Write-Host "This script will check if pre-requisites are met. If not, it will attempt to install the pre-requisites and copy the GitHub sample app locally. You will have the option to approve the installation of each of the following pre-requisites: " -ForegroundColor Yellow
Write-Host "A) Node.js" -ForegroundColor Yellow
Write-Host "B) npm (which is part of node.js)" -ForegroundColor Yellow
Write-Host "C) vite (for running the application)" -ForegroundColor Yellow
Write-Host "D) Github client (for cloning the sample app locally)" -ForegroundColor Yellow
$confirmation = Read-Host "Do you want to continue? [Y]Yes/[N]No" 

if ($confirmation -ne "Y") {
    Write-Host "Script execution stopped by the user." -ForegroundColor Red
    exit
}

Write-Host "Proceeding with the pre-requisite checks and installations..." -ForegroundColor Green

# Check Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed." -ForegroundColor Red
    $installNode = Read-Host "Do you want to install Node.js automatically? [Y]Yes/[N]No"
    if ($installNode.ToUpper() -eq "Y") {
        Write-Host "Installing Node.js..."
        # Define the Node.js version to install
        $nodeVersion = "22.17.1" # Replace with the desired version
        $installerUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi"
        $installerPath = "$env:TEMP\node-v$nodeVersion-x64.msi"

        # Download the Node.js installer
        Write-Host "Downloading Node.js installer..."
        Start-BitsTransfer -Source $installerUrl -Destination $installerPath

        # Run the installer
        Write-Host "Running Node.js installer..."
        Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait

        # Refresh environment variables after Node.js installation
        [System.Environment]::SetEnvironmentVariable("Path", [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User"), "Process")

        # Verify Node.js installation again
        if (Get-Command "node" -ErrorAction SilentlyContinue) {
            Write-Host "Node.js is installed and available in the current session." -ForegroundColor Green
        } else {
            Write-Host "Node.js is not available. Please restart PowerShell or check the installation." -ForegroundColor Red
            exit
        }

        # Clean up
        Remove-Item $installerPath -Force
    } else {
        Write-Host "Please install Node.js manually from https://nodejs.org/"
        Start-Process "https://nodejs.org/"
        exit
    }
} else {
    Write-Host "Node.js is installed." -ForegroundColor Green
}
# Refresh environment variables after Node.js installation
        [System.Environment]::SetEnvironmentVariable("Path", [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User"), "Process")

# Check npm
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed." -ForegroundColor Red
    $installNpm = Read-Host "Do you want to install npm automatically? [Y]Yes/[N]o"
    if ($installNpm.ToUpper() -eq "Y") {
        Write-Host "Installing npm..."
        Start-Process "npm" -ArgumentList "install -g npm@latest" -NoNewWindow -Wait
        
        # Refresh environment variables after Node.js installation
        [System.Environment]::SetEnvironmentVariable("Path", [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User"), "Process")

        # Verify npm installation
        if (Get-Command "npm" -ErrorAction SilentlyContinue) {
            Write-Host "npm installed successfully." -ForegroundColor Green
        } else {
            Write-Host "npm installation failed. Please install it manually from https://nodejs.org/" -ForegroundColor Red
            Start-Process "https://nodejs.org/"
            exit
        }
    } else {
        Write-Host "Please install npm manually from https://nodejs.org/"
        Start-Process "https://nodejs.org/"
        exit
    }
} else {
    Write-Host "npm is installed." -ForegroundColor Green
}

# Ensure Vite is installed
Write-Host "Checking if Vite is installed..." -ForegroundColor Yellow
if (-not (Get-Command "vite" -ErrorAction SilentlyContinue)) {
    Write-Host "Vite is not installed. Installing Vite globally..." -ForegroundColor Red
    npm install -g vite

    # Verify Vite installation
    if (Get-Command "vite" -ErrorAction SilentlyContinue) {
        Write-Host "Vite installed successfully." -ForegroundColor Green
    } else {
        Write-Host "Vite installation failed. Please install it manually using 'npm install -g vite'." -ForegroundColor Red
        exit
    }
} else {
    Write-Host "Vite is already installed." -ForegroundColor Green
}

# Ensure Git is installed
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Host "Git is not installed."
    $installGit = Read-Host "Do you want to install Git automatically? [Y]Yes/[N]No"
    if ($installGit.ToUpper() -eq "Y") {
        Write-Host "Installing Git..."
        # Define the Git installer URL
        $gitInstallerUrl = "https://github.com/git-for-windows/git/releases/download/v2.50.1.windows.1/Git-2.50.1-64-bit.exe"
        $gitInstallerPath = "$env:TEMP\Git-2.50.1-64-bit.exe"

        # Download the Git installer
        Write-Host "Downloading Git installer..."
        Start-BitsTransfer -Source $gitInstallerUrl -Destination $gitInstallerPath

        # Run the installer
        Write-Host "Running Git installer..."
        Start-Process -FilePath $gitInstallerPath -ArgumentList "/VERYSILENT /NORESTART" -Wait

        # Refresh environment variables after Git installation
        [System.Environment]::SetEnvironmentVariable("Path", [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User"), "Process")

        # Verify installation
        if (Get-Command "git" -ErrorAction SilentlyContinue) {
            Write-Host "Git installed successfully." -ForegroundColor Green
        } else {
            Write-Host "Git installation failed. Please install it manually from https://git-scm.com/" -ForegroundColor Red
            Start-Process "https://git-scm.com/"
            exit
        }

        # Clean up
        Remove-Item $gitInstallerPath -Force
    } else {
        Write-Host "Please install Git manually from https://git-scm.com/" -ForegroundColor Red
        Start-Process "https://git-scm.com/"
        exit
    }
} else {
    Write-Host "Git is installed." -ForegroundColor Green
}

# Check if the GitHub repository is cloned locally
$repoUrl = "https://github.com/doug-msft/MSKK-AI-Sample-App-with-red-teaming"
$localRepoPath = "C:\DEV\AzureAIFoundry-SecurityTestApp" # Adjust this path as needed
$localRepoPathApp = Join-Path $localRepoPath "\SecurityTestApp"

if (-not (Test-Path $localRepoPath)) {
    Write-Host "The repository is not cloned locally. Cloning the repository..." -ForegroundColor red

    # Prompt the user for cloning the repository
    $cloneRepo = Read-Host "Do you want to clone the repository automatically? [Y]Yes/[N]o"
    if ($cloneRepo.ToUpper() -eq "N") {
        Write-Host "No problem, you can download the source code directly from the GitHub repository page..." -ForegroundColor Yellow
        Start-Process "https://github.com/doug-msft/MSKK-AI-Sample-App-with-red-teaming"
        exit
    }

    # Ensure Git is installed
    if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
        Write-Host "Git is not installed. Please install Git from https://git-scm.com/" -ForegroundColor Red
        exit
    }

    # Clone the repository
    git clone $repoUrl $localRepoPath

    # Verify the repository was cloned successfully
    if (-not (Test-Path $localRepoPath)) {
        Write-Host "Failed to clone the repository. Please try again manually." -ForegroundColor Red
        exit
    } else {
        Write-Host "Repository cloned successfully." -ForegroundColor Green
    }
} else {
    Write-Host "The repository is already cloned locally." -ForegroundColor Green
}
#navigate to the cloned repository
Write-Host "Navigating to the cloned repository..." -ForegroundColor Yellow
Set-Location $localRepoPath


# Install Vite and its React plugin
Write-Host "Installing Vite and @vitejs/plugin-react..." -ForegroundColor Yellow
npm install vite --save-dev
npm install @vitejs/plugin-react --save-dev
npm install react@latest react-dom@latest
npm install react-router-dom
npm install openai
npm install react-markdown

# All pre-requisites are met
Write-Host "All pre-requisites are met. You can now run the application." -ForegroundColor Green

Write-Host "Make sure you have deployed the LLM Models and Entra ID app." -ForegroundColor Yellow
Write-Host "And have configured the config.js file with the necessary variables." -ForegroundColor Yellow


Write-Host "Navigating to the app path so you can start the app by executing 'npm run dev'..." -ForegroundColor Yellow
Set-Location $localRepoPathAppcd
