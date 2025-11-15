#!/bin/bash
cd /c/Users/lukas/PyCharmMiscProject

# Remove cloudflared files
git rm -f cloudflared.exe cloudflared.yml cloudflared-*.yml

# Remove tunnel setup scripts
git rm -f setup-cloudflared-*.ps1 setup-tunnel.ps1 setup-homepl-tunnel.ps1 setup-multi-tunnels.ps1 setup-single-tunnel.ps1
git rm -f install-tunnel.ps1 install-cloudflared-service.* manage-tunnel.cmd run-tunnel.cmd
git rm -f fix-tunnel*.ps1 refresh_tunnel_token.ps1 start-quick-tunnel.* clean-setup-tunnel.ps1
git rm -f download-cloudflared.ps1 get_token.ps1 reinstall-tunnel.ps1 start-tunnel.ps1 get-admin-key.ps1

# Remove deployment scripts
git rm -f deploy-*.ps1 deploy-*.sh deploy.py final-deploy.ps1 deploy-no-docker.sh
git rm -f upload-files.ps1 upload_to_homepl.ps1 connect-ssh.ps1 diagnose-ssh.ps1 deploy-to-homepl.ps1

# Remove .cloudflared directory
git rm -r .cloudflared/

# Remove tunnel-related files
git rm -f tunnel-token.txt

# Remove non-essential documentation
git rm -f CLOUDFLARE_*.md TUNNEL_*.md SSH_*.md HOME_PL_*.md DEPLOYMENT_PL.md
git rm -f EASY_PUBLIC_ACCESS*.md NETWORK_ACCESS_*.md DOSTEP_*.md UDOSTEPNIANIE_*.md
git rm -f NAPRAWA_*.md WDROZENIE_*.md HYBRID_SETUP.md LOG_ROTATION.md PERMANENT_TUNNEL_*.md
git rm -f ACTION_REQUIRED_DNS.md NAMESERVER_*.md DO_THIS_NOW_*.md

# Keep these: README.md, .env.example, DEPLOYMENT_READY.md, railway.json, Dockerfile, docker-compose.yml
