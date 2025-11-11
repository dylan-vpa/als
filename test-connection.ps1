# Configuration
$EC2_HOST = "ubuntu@ec2-3-210-177-245.compute-1.amazonaws.com"
$PEM_FILE = "Serambiente-KPair-NV.pem"
$SSH_COMMAND = "echo 'Conexión exitosa'"

# Test SSH connection
try {
    Write-Host "Probando conexión SSH a $EC2_HOST..." -ForegroundColor Cyan
    $result = & ssh -i $PEM_FILE -o StrictHostKeyChecking=no -o ConnectTimeout=10 $EC2_HOST $SSH_COMMAND 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "¡Conexión exitosa!" -ForegroundColor Green
        Write-Host "Respuesta del servidor: $result" -ForegroundColor Green
    } else {
        Write-Host "Error en la conexión. Código de salida: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Mensaje de error: $result" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Additional diagnostics
Write-Host "`nInformación del sistema:" -ForegroundColor Yellow
Write-Host "Sistema operativo: $($PSVersionTable.OS)"
Write-Host "Versión de PowerShell: $($PSVersionTable.PSVersion)"
Write-Host "Directorio actual: $(Get-Location)"
Write-Host "Archivo PEM existe: $(Test-Path $PEM_FILE)"
Write-Host "Permisos del archivo PEM:"
Get-Acl $PEM_FILE | Format-List