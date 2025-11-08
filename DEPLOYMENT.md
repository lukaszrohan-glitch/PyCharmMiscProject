# Deployment Guide for ArkuszowniaSMB

## System Requirements

### Hardware Requirements
- CPU: 2+ cores
- RAM: 4GB minimum
- Storage: 20GB free space
- Network: 100Mbps minimum

### Software Requirements
1. Operating System:
   - Windows 10/11
   - WSL2 enabled
   - Docker Desktop installed and running

2. Development Tools:
   - Python 3.11+
   - Node.js 18+
   - Visual Studio Code (recommended)
   - Git

3. Required Software:
   - Docker Desktop
   - Cloudflare CLI (cloudflared)

## Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/arkuszowniasmb.git
   cd arkuszowniasmb
   ```

2. Set up environment:
   ```bash
   copy .env.example .env
   # Edit .env with your configuration
   ```

3. Configure Cloudflare:
   - Register domain arkuszowniasmb.pl
   - Set up DNS records
   - Configure tunnel
   - Update cloudflared-config.yml

## Application Structure

```
/
├── frontend/          # React frontend
├── backend/           # FastAPI backend
├── nginx/            # Nginx configuration
├── scripts/          # Utility scripts
└── docker/           # Docker configuration
```

## Development Setup

1. Install dependencies:
   ```bash
   # Backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt

   # Frontend
   cd frontend
   npm install
   ```

2. Start development servers:
   ```bash
   # Terminal 1 - Backend
   python main.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Production Deployment

1. Build containers:
   ```bash
   docker-compose build
   ```

2. Start services:
   ```bash
   docker-compose up -d
   ```

3. Initialize database:
   ```bash
   docker-compose exec backend python init_db.py
   ```

4. Create admin user:
   ```bash
   docker-compose exec backend python create_admin.py
   ```

## Management Scripts

1. Start application:
   ```bash
   start-app.cmd
   ```

2. Check health:
   ```bash
   check-health.cmd
   ```

3. Backup database:
   ```bash
   backup-db.cmd
   ```

4. Stop application:
   ```bash
   stop-app.cmd
   ```

## Monitoring

1. Health checks:
   - Frontend: http://localhost/healthz
   - Backend: http://localhost:8080/healthz

2. Logs:
   ```bash
   docker-compose logs -f
   ```

3. Database:
   ```bash
   docker-compose exec db psql -U smb_user smbtool
   ```

## Backup and Recovery

1. Manual backup:
   ```bash
   backup-db.cmd
   ```

2. Automated backups:
   - Daily at 3:00 AM
   - Stored in /backups
   - Retained for 30 days

3. Recovery:
   ```bash
   docker-compose exec -T db psql -U smb_user smbtool < backup.sql
   ```

## Security

1. API Keys:
   - Rotate every 90 days
   - Generated through admin panel
   - Audit logs maintained

2. SSL/TLS:
   - Managed by Cloudflare
   - Automatic renewal
   - Always use HTTPS

3. Passwords:
   - Minimum 8 characters
   - Must include numbers and special characters
   - Changed every 180 days

## Troubleshooting

1. Container issues:
   ```bash
   docker-compose down
   docker-compose up -d --force-recreate
   ```

2. Database issues:
   ```bash
   docker-compose exec db psql -U postgres
   ```

3. Network issues:
   - Check Cloudflare status
   - Verify DNS records
   - Test local connectivity

## Support

For issues:
1. Check logs
2. Review documentation
3. Contact support:
   - Email: admin@arkuszowniasmb.pl
   - GitHub issues
   - Emergency: +XX XXX XXX XXX
