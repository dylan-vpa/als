# Configuration
$EC2_HOST = "ubuntu@ec2-3-210-177-245.compute-1.amazonaws.com"
$PEM_FILE = "Serambiente-KPair-NV.pem"
$REMOTE_DIR = "/home/ubuntu/als"
$SSH_OPTIONS = @(
    "-i", $PEM_FILE,
    "-o", "StrictHostKeyChecking=no",
    "-o", "ConnectTimeout=30",
    "-o", "BatchMode=yes",
    "-o", "ServerAliveInterval=15",
    "-o", "ExitOnForwardFailure=yes"
)

# Function to execute SSH commands with retry logic
function Invoke-SSHCommand {
    param (
        [string]$Command,
        [int]$MaxRetries = 3,
        [int]$RetryDelay = 5
    )
    
    $retryCount = 0
    $lastError = $null
    
    while ($retryCount -lt $MaxRetries) {
        try {
            Write-Host "Ejecutando: $Command" -ForegroundColor Cyan
            $process = Start-Process -FilePath "ssh" -ArgumentList ($SSH_OPTIONS + $EC2_HOST, $Command) `
                -NoNewWindow -PassThru -Wait -RedirectStandardOutput "ssh_stdout.txt" -RedirectStandardError "ssh_stderr.txt"
            
            $stdout = Get-Content "ssh_stdout.txt" -Raw -ErrorAction SilentlyContinue
            $stderr = Get-Content "ssh_stderr.txt" -Raw -ErrorAction SilentlyContinue
            
            if ($process.ExitCode -eq 0) {
                if ($stdout) { Write-Host $stdout -ForegroundColor DarkGray }
                return $stdout
            } else {
                throw "Código de salida: $($process.ExitCode)`n$stderr"
            }
        } catch {
            $lastError = $_.Exception.Message
            $retryCount++
            if ($retryCount -lt $MaxRetries) {
                Write-Warning "Reintentando ($retryCount/$MaxRetries) en ${RetryDelay}s... Error: $lastError"
                Start-Sleep -Seconds $RetryDelay
            }
        } finally {
            Remove-Item "ssh_stdout.txt", "ssh_stderr.txt" -ErrorAction SilentlyContinue
        }
    }
    
    throw "Error después de $MaxRetries intentos. Último error: $lastError"
}

# Improved file copy function with retry and chunking
function Copy-ToRemote {
    param (
        [string]$LocalPath,
        [string]$RemotePath = $REMOTE_DIR,
        [int]$MaxRetries = 3
    )
    
    try {
        $retryCount = 0
        $success = $false
        
        # Create a temporary directory for this copy operation
        $tempDir = [System.IO.Path]::GetRandomFileName()
        $tempPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), $tempDir)
        New-Item -ItemType Directory -Path $tempPath -Force | Out-Null
        
        try {
            # Copy files to temp directory first
            Copy-Item -Path $LocalPath -Destination $tempPath -Recurse -Force
            
            # Create remote directory if it doesn't exist
            Invoke-SSHCommand "mkdir -p $RemotePath" -MaxRetries 1
            
            # Copy in smaller chunks if the directory is large
            Get-ChildItem -Path $tempPath -File -Recurse | ForEach-Object {
                $relativePath = $_.FullName.Substring($tempPath.Length).TrimStart('\')
                $remoteFile = "$RemotePath/$relativePath".Replace('\', '/')
                $remoteDir = [System.IO.Path]::GetDirectoryName($remoteFile).Replace('\', '/')
                
                # Ensure remote directory exists
                if ($remoteDir -ne $RemotePath) {
                    Invoke-SSHCommand "mkdir -p `"$remoteDir`"" -MaxRetries 1
                }
                
                # Copy individual file with retry
                $retryCount = 0
                $fileCopied = $false
                
                while (-not $fileCopied -and $retryCount -lt $MaxRetries) {
                    try {
                        Write-Host "Copiando $($_.Name)..." -ForegroundColor Yellow
                        $scpArgs = @(
                            "-i", $PEM_FILE,
                            "-o", "StrictHostKeyChecking=no",
                            "-o", "ConnectTimeout=30",
                            "-o", "ServerAliveInterval=15",
                            $_.FullName,
                            "${EC2_HOST}:${remoteFile}"
                        )
                        
                        $scpProcess = Start-Process -FilePath "scp" -ArgumentList $scpArgs -NoNewWindow -PassThru -Wait
                        
                        if ($scpProcess.ExitCode -ne 0) {
                            throw "Código de salida: $($scpProcess.ExitCode)"
                        }
                        
                        $fileCopied = $true
                    } catch {
                        $retryCount++
                        if ($retryCount -ge $MaxRetries) {
                            throw "Error copiando $($_.Name) después de $MaxRetries intentos: $_"
                        }
                        Write-Warning "Reintentando copia de $($_.Name)... ($retryCount/$MaxRetries)"
                        Start-Sleep -Seconds ([math]::Pow(2, $retryCount)) # Exponential backoff
                    }
                }
            }
            
            $success = $true
            Write-Host "Copia completada exitosamente" -ForegroundColor Green
            
        } finally {
            # Clean up temp directory
            if (Test-Path $tempPath) {
                Remove-Item -Path $tempPath -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
        
    } catch {
        Write-Error "Error copiando archivos: $_"
        exit 1
    }
}

# Main execution
try {
    Write-Host "=== Iniciando despliegue en AWS ===" -ForegroundColor Green
    
    # 1. Create remote directory with proper permissions
    Write-Host "Creando directorio remoto..." -ForegroundColor Cyan
    Invoke-SSHCommand "sudo mkdir -p $REMOTE_DIR && sudo chown -R ubuntu:ubuntu $REMOTE_DIR"
    
    # 2. Copy files in smaller chunks
    Write-Host "Copiando archivos al servidor..." -ForegroundColor Cyan
    Copy-ToRemote -LocalPath "*" -RemotePath $REMOTE_DIR
    
    # 3. Install Docker with improved script
    Write-Host "Configurando Docker..." -ForegroundColor Cyan
    $dockerScript = @"
#!/bin/bash
set -e

# Update and install prerequisites
echo "Actualizando paquetes..."
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up the stable repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
echo "Instalando Docker..."
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
echo "Instalando Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group
sudo usermod -aG docker $USER

# Enable and start Docker service
sudo systemctl enable --now docker
"@

    $dockerScript | Out-File -FilePath "docker_setup.sh" -Encoding ascii -Force
    try {
        Copy-ToRemote -LocalPath "docker_setup.sh" -RemotePath "/tmp/"
        Invoke-SSHCommand "chmod +x /tmp/docker_setup.sh && /tmp/docker_setup.sh"
    } finally {
        Remove-Item "docker_setup.sh" -Force -ErrorAction SilentlyContinue
    }
    
    # 4. Start containers with health checks
    Write-Host "Iniciando contenedores..." -ForegroundColor Cyan
    Invoke-SSHCommand "cd $REMOTE_DIR && docker-compose -f docker-compose.yml -f docker-compose.prod.yml down || true"
    Invoke-SSHCommand "cd $REMOTE_DIR && docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache"
    Invoke-SSHCommand "cd $REMOTE_DIR && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
    
    # 5. Verify services are running
    Write-Host "Verificando servicios..." -ForegroundColor Cyan
    Invoke-SSHCommand "docker ps --format 'table {{.Names}}\t{{.Status}}'"
    
    Write-Host "`n=== ¡Despliegue completado con éxito! ===" -ForegroundColor Green
    Write-Host "La aplicación debería estar disponible en: http://ec2-3-210-177-245.compute-1.amazonaws.com" -ForegroundColor Green
    
} catch {
    Write-Error "Error durante el despliegue: $_"
    exit 1
}