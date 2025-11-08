# Welcome to ArkuszowniaSMB

## Quick Start

1. Double-click `start-app.cmd` to start the application
2. Wait for all services to initialize (about 30 seconds)
3. Open your browser to:
   - Local access: http://localhost
   - Network access: https://arkuszowniasmb.pl

## Default Admin Account

- Email: ciopqj@gmail.com
- Password: SMB#Admin2025!

## Features

- Create and manage orders
- Track inventory
- Log employee time
- Generate financial reports
- Dark/Light theme support
- Full Polish/English language support

## Components

The application consists of several services:

- Frontend (React)
- Backend API (FastAPI)
- Database (PostgreSQL)
- Reverse Proxy (Nginx)
- Tunnel (Cloudflare)

## Security

- All traffic is encrypted (HTTPS)
- Password requirements enforced
- API key rotation supported
- Rate limiting enabled
- Audit logging active

## Network Access

The application is accessible via:

1. Local network:
   - http://localhost (development)
   - https://arkuszowniasmb.pl (production)

2. External access:
   - https://arkuszowniasmb.pl
   - https://www.arkuszowniasmb.pl

## Troubleshooting

If you experience issues:

1. Check Docker status:
   ```
   docker-compose ps
   ```

2. View logs:
   ```
   docker-compose logs
   ```

3. Restart services:
   ```
   docker-compose restart
   ```

4. Full reset:
   ```
   docker-compose down
   docker-compose up -d
   ```

## Support

For technical support:
- Email: admin@arkuszowniasmb.pl
- Documentation: https://arkuszowniasmb.pl/docs
