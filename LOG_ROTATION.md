# Log Rotation Configuration

## Overview

The application generates logs from multiple sources:
- **Backend (uvicorn)**: Application logs in `/app/logs/`
- **Nginx**: Access and error logs in `/var/log/nginx/`
- **Database**: PostgreSQL logs (if available)

Proper log rotation prevents disk space exhaustion and maintains system performance.

## Configuration Files

### Logrotate Config: `logrotate.conf`

```
/app/logs/*.log /var/log/nginx/*.log {
    daily              # Rotate daily
    rotate 7          # Keep 7 rotated files
    compress          # Compress old logs (gzip)
    delaycompress     # Don't compress yesterday's file yet
    copytruncate      # Copy and truncate instead of move
    notifempty        # Don't rotate empty logs
}
```

## Log Rotation Policies

### Rotation Frequency
| Log Type | Frequency | Retention |
|----------|-----------|-----------|
| Access Logs | Daily | 14 days |
| Error Logs | Daily | 7 days |
| Application Logs | Daily | 7 days |
| PostgreSQL Logs | Daily | 7 days |

### Compression
- Rotated logs are compressed with gzip
- Compression happens after 1 day (delaycompress)
- Typical compression ratio: 70-90% space savings

## Docker Implementation

### For Development

Logs are stored locally in `./logs/`:
```
./logs/
├── nginx/
│   ├── access.log
│   └── error.log
└── app/
    └── application.log
```

**Note**: Log rotation is optional in development; logs are typically cleared between restarts.

### For Production

Update `docker-compose.yml` to include logrotate:

```yaml
backend:
  volumes:
    - ./logrotate.conf:/etc/logrotate.d/app:ro
  # This ensures logrotate can access the config

nginx:
  volumes:
    - ./logrotate.conf:/etc/logrotate.d/nginx:ro
```

Update `Dockerfile` to include logrotate:

```dockerfile
RUN apt-get install -y --no-install-recommends logrotate cron
```

## Manual Log Rotation

### Trigger rotation immediately

```bash
# Inside the container
logrotate -f /etc/logrotate.d/app

# Via docker-compose
docker-compose exec backend logrotate -f /etc/logrotate.d/app
docker-compose exec nginx logrotate -f /etc/logrotate.d/nginx
```

### View current logs

```bash
# Application logs
docker-compose logs -f backend

# Nginx logs
docker-compose logs -f nginx

# Or access logs directly
cat logs/nginx/access.log
cat logs/app/application.log
```

### Clear specific logs

```bash
# Clear all logs
rm -rf logs/*

# Clear nginx logs only
rm logs/nginx/*.log

# Clear application logs
rm logs/app/*.log
```

## Monitoring Log Space

### Check log directory size

```powershell
# Windows
Get-ChildItem -Path .\logs -Recurse | Measure-Object -Property Length -Sum

# Linux
du -sh ./logs
```

### Monitor disk usage

```bash
# Inside container
df -h

# Docker volume usage
docker volume inspect smbtool_db_data
```

## Troubleshooting

### Logs not rotating

1. **Check logrotate status**:
   ```bash
   docker-compose exec backend logrotate -f /etc/logrotate.d/app -v
   ```

2. **Verify file permissions**:
   ```bash
   docker-compose exec backend ls -la /app/logs/
   docker-compose exec nginx ls -la /var/log/nginx/
   ```

3. **Check cron daemon** (if using scheduled rotation):
   ```bash
   docker-compose exec backend ps aux | grep cron
   ```

### Disk space issues

If logs consume too much space:

```bash
# Reduce retention period in logrotate.conf
# Or manually clean up
docker-compose exec backend rm -f /app/logs/*.log.*
docker-compose exec nginx rm -f /var/log/nginx/*.log.*
```

## Best Practices

1. **Monitor disk usage regularly**
2. **Archive rotated logs** to external storage weekly
3. **Set up alerts** for disk usage > 80%
4. **Test rotation** in non-production first
5. **Review logs regularly** for errors and warnings
6. **Implement log aggregation** (ELK stack, CloudWatch, etc.)

## Log Aggregation (Optional)

### Send logs to external service

Example: Forward nginx logs to CloudWatch

```yaml
# In docker-compose.yml
nginx:
  logging:
    driver: awslogs
    options:
      awslogs-group: /arkuszownia/nginx
      awslogs-region: us-east-1
```

## Security Considerations

- **Access Control**: Restrict log file permissions
- **Sensitive Data**: Scrub credentials from logs
- **Log Retention**: Archive logs securely for compliance
- **Audit Trail**: Keep logs for security investigations (minimum 90 days recommended)

## References

- [Logrotate Man Page](https://linux.die.net/man/8/logrotate)
- [Docker Logging Drivers](https://docs.docker.com/config/containers/logging/configure/)
