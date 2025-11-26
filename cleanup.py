#!/usr/bin/env python
import os
import subprocess
import sys

os.chdir(r"C:\Users\lukas\PyCharmMiscProject")

files_to_remove = [
    "cloudflared.exe",
    "cloudflared.yml",
    "cloudflared-homepl.yml",
    "cloudflared-config.yml",
    "cloudflared-config-pl.yml",
    "setup-cloudflared-local.ps1",
    "setup-cloudflared-remote.ps1",
    "setup-tunnel.ps1",
    "setup-homepl-tunnel.ps1",
    "setup-multi-tunnels.ps1",
    "setup-single-tunnel.ps1",
    "install-tunnel.ps1",
    "install-cloudflared-service.cmd",
    "install-cloudflared-service.ps1",
    "manage-tunnel.cmd",
    "run-tunnel.cmd",
    "fix-tunnel.cmd",
    "fix-tunnel-token.ps1",
    "refresh_tunnel_token.ps1",
    "start-quick-tunnel.bat",
    "start-quick-tunnel.cmd",
    "start-quick-tunnel.ps1",
    "clean-setup-tunnel.ps1",
    "download-cloudflared.ps1",
    "get_token.ps1",
    "reinstall-tunnel.ps1",
    "start-tunnel.ps1",
    "get-admin-key.ps1",
    "deploy-now.ps1",
    "deploy-full.ps1",
    "deploy-ssh.ps1",
    "deploy-to-homepl.ps1",
    "deploy-no-docker.sh",
    "deploy.py",
    "deploy-now.sh",
    "final-deploy.ps1",
    "deploy-app.zip",
    "arkuszownia-deploy-20251115-124504.zip",
    "upload-files.ps1",
    "upload_to_homepl.ps1",
    "connect-ssh.ps1",
    "diagnose-ssh.ps1",
    "tunnel-token.txt",
    "prepare-cloudflared-creds.cmd",
    "msg.txt",
    "delete",
    "start",
    "query",
    "stop",
]

docs_to_remove = [
    "CLOUDFLARE_DNS_FIX_VISUAL.md",
    "CLOUDFLARE_MIGRATION_COMPLETE.md",
    "CLOUDFLARE_SETUP_FINAL.md",
    "CLOUDFLARE_SETUP.md",
    "CLOUDFLARE_TUNNEL_GUIDE.md",
    "CLOUDFLARE_TUNNEL_TROUBLESHOOTING.md",
    "TUNNEL_SETUP_LOCAL.md",
    "TUNEL_SETUP_STATUS.md",
    "SSH_CONNECTION_ANALYSIS.md",
    "SSH_TROUBLESHOOTING.md",
    "HOME_PL_BACKEND_MIGRATION.md",
    "SETUP_HOME_PL.md",
    "DEPLOYMENT_PL.md",
    "EASY_PUBLIC_ACCESS_PL.md",
    "EASY_PUBLIC_ACCESS.md",
    "NETWORK_ACCESS_GUIDE.md",
    "NETWORK_ACCESS_GUIDE_PL.md",
    "DOSTEP_SIECIOWY.md",
    "DOSTEP_ZEWNETRZNY.md",
    "UDOSTEPNIANIE_UZYTKOWNIKOM.md",
    "UDOSTEPNIJ.cmd",
    "NAPRAWA_BIALA_STRONA_CACHE.md",
    "NAPRAWA_CERTYFIKATY.md",
    "NAPRAWA_DNS_CLOUDFLARE.md",
    "NAPRAWA_POLACZENIA_COMPLETE.md",
    "NAPRAWA_SKLADNI_ORDERLINES.md",
    "WDROZENIE_TECHNICZNE.md",
    "WDROZENIE.md",
    "HYBRID_SETUP.md",
    "LOG_ROTATION.md",
    "PERMANENT_TUNNEL_SETUP_PL.md",
    "ACTION_REQUIRED_DNS.md",
    "NAMESERVER_UPDATE_REQUIRED.md",
    "NAMESERVER_*.md",
    "DO_THIS_NOW_*.md",
    "MIGRATION_NGROK_TO_CLOUDFLARE.md",
    "CO_TERAZ_ZROBIC.md",
]

for f in files_to_remove + docs_to_remove:
    try:
        if os.path.exists(f):
            subprocess.run(["git", "rm", "-f", f], check=False)
            print(f"Removed: {f}")
    except Exception as e:
        print(f"Failed to remove {f}: {e}")

try:
    if os.path.isdir(".cloudflared"):
        subprocess.run(["git", "rm", "-r", "-f", ".cloudflared"], check=False)
        print("Removed: .cloudflared/")
except Exception as e:
    print(f"Failed to remove .cloudflared: {e}")

print("Cleanup complete!")
