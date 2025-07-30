# Prompt the user before proceeding
Write-Host "This script will check if pre-requisites are met. If not, it will attempt to install the pre-requisites and copy the GitHub sample app locally. You will have the option to approve the installation of each of the following pre-requisites: " -ForegroundColor Yellow
Write-Host "A) Node.js" -ForegroundColor Yellow
Write-Host "B) npm (which is part of node.js)" -ForegroundColor Yellow
Write-Host "C) Github client (for cloning the sample app locally)" -ForegroundColor Yellow
$confirmation = Read-Host "Do you want to continue? (yes/no)"-ForegroundColor red
y
if ($confirmation -ne "yes") {
    Write-Host "Script execution stopped by the user." -ForegroundColor Red
    exit
}

Write-Host "Proceeding with the pre-requisite checks and installations..." -ForegroundColor Green

# Check Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed."
    $installNode = Read-Host "Do you want to install Node.js automatically? [Y]Yes/[N]No"
    if ($installNode.ToUpper() -eq "Y") {
        Write-Host "Installing Node.js..."
        # Define the Node.js version to install
        $nodeVersion = "22.17.1" # Replace with the desired version
        $installerUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi"
        $installerPath = "$env:TEMP\node-v$nodeVersion-x64.msi"

        # Download the Node.js installer
        Write-Host "Downloading Node.js installer..."
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

        # Run the installer
        Write-Host "Running Node.js installer..."
        Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait

        # Refresh environment variables after Node.js installation
        [System.Environment]::SetEnvironmentVariable("Path", [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User"), "Process")

        # Verify Node.js installation again
        if (Get-Command "node" -ErrorAction SilentlyContinue) {
            Write-Host "Node.js is installed and available in the current session."
        } else {
            Write-Host "Node.js is not available. Please restart PowerShell or check the installation."
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
    Write-Host "Node.js is installed."
}

# Check npm
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed."
    $installNpm = Read-Host "Do you want to install npm automatically? [Y]Yes/[N]No"
    if ($installNpm.ToUpper() -eq "Y") {
        Write-Host "Installing npm..."
        Start-Process "npm" -ArgumentList "install -g npm@latest" -NoNewWindow -Wait

        # Verify npm installation
        if (Get-Command "npm" -ErrorAction SilentlyContinue) {
            Write-Host "npm installed successfully."
        } else {
            Write-Host "npm installation failed. Please install it manually from https://nodejs.org/"
            Start-Process "https://nodejs.org/"
            exit
        }
    } else {
        Write-Host "Please install npm manually from https://nodejs.org/"
        Start-Process "https://nodejs.org/"
        exit
    }
} else {
    Write-Host "npm is installed."
}

# Ensure Git is installed
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Host "Git is not installed."
    $installGit = Read-Host "Do you want to install Git automatically? [Y]Yes/[N]No"
    if ($installGit.ToUpper() -eq "Y") {
        Write-Host "Installing Git..."
        # Define the Git installer URL
        $gitInstallerUrl = "https://github.com/git-for-windows/git/releases/latest/download/Git-2.41.0-64-bit.exe" # Replace with the latest version if needed
        $gitInstallerPath = "$env:TEMP\Git-2.41.0-64-bit.exe"

        # Download the Git installer
        Write-Host "Downloading Git installer..."
        Invoke-WebRequest -Uri $gitInstallerUrl -OutFile $gitInstallerPath

        # Run the installer
        Write-Host "Running Git installer..."
        Start-Process -FilePath $gitInstallerPath -ArgumentList "/VERYSILENT /NORESTART" -Wait

        # Verify installation
        if (Get-Command "git" -ErrorAction SilentlyContinue) {
            Write-Host "Git installed successfully."
        } else {
            Write-Host "Git installation failed. Please install it manually from https://git-scm.com/"
            Start-Process "https://git-scm.com/"
            exit
        }

        # Clean up
        Remove-Item $gitInstallerPath -Force
    } else {
        Write-Host "Please install Git manually from https://git-scm.com/"
        Start-Process "https://git-scm.com/"
        exit
    }
} else {
    Write-Host "Git is installed."
}

# Check if the GitHub repository is cloned locally
$repoUrl = "https://github.com/doug-msft/MSKK-AI-Sample-App-with-red-teaming"
$localRepoPath = "C:\DEV\AzureAIFoundry-SecurityTestApp" # Adjust this path as needed

if (-not (Test-Path $localRepoPath)) {
    Write-Host "The repository is not cloned locally. Cloning the repository..."

    # Ensure Git is installed
    if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
        Write-Host "Git is not installed. Please install Git from https://git-scm.com/"
        exit
    }

    # Clone the repository
    git clone $repoUrl $localRepoPath

    # Verify the repository was cloned successfully
    if (-not (Test-Path $localRepoPath)) {
        Write-Host "Failed to clone the repository. Please try again manually."
        exit
    } else {
        Write-Host "Repository cloned successfully."
    }
} else {
    Write-Host "The repository is already cloned locally."
}

# All pre-requisites are met
Write-Host "All pre-requisites are met. You can now run the application."