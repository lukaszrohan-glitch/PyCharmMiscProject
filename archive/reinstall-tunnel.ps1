if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    $arguments = "& '" + $myinvocation.mycommand.definition + "'"
    Start-Process powershell -Verb runAs -ArgumentList $arguments
    Break
}

Write-Host "Removing existing cloudflared service..."
cloudflared.exe service uninstall

Write-Host "Installing cloudflared service with new token..."
cloudflared.exe service install CwI0C09ViTtBCdBZleXpHqYEttnl32XeNNNPNwQL

Write-Host "Starting cloudflared service..."
Start-Service cloudflared

Write-Host "Service status:"
Get-Service cloudflared

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
