# Monitoring Setup Guide

## Overview

The application includes a comprehensive monitoring stack with Prometheus for metrics collection and Grafana for visualization.

### Stack Components

- **Prometheus**: Time-series database and metrics collector (port 9090)
- **Grafana**: Visualization and dashboarding (port 3000)
- **Node Exporter**: System metrics collection (port 9100)
- **Alert Manager**: Alert handling and routing (optional)

## Quick Start

### Start Monitoring Stack

```powershell
# Start monitoring services alongside main application
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### Access Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/change-me-in-production)

## Prometheus Configuration

### Scrape Targets

The system monitors:

| Target | Interval | Purpose |
|--------|----------|---------|
| Backend | 30s | Application metrics (requests, errors, latency) |
| Nginx | 30s | Web server metrics |
| Database | 60s | PostgreSQL connection and query metrics |
| Node | 30s | System metrics (CPU, memory, disk) |

### Retention Policy

- **Data retention**: 15 days (configured in docker-compose)
- **Scrape interval**: 30s for most targets
- **Evaluation interval**: 15s for alert rules

### Metrics Available

#### Backend (FastAPI)

```
http_requests_total              # Total HTTP requests
http_request_duration_seconds    # Request latency
http_exceptions_total            # Unhandled exceptions
database_connections_used        # Active DB connections
```

#### Nginx

```
nginx_http_requests_total        # HTTP requests by status
nginx_http_request_size_bytes    # Request sizes
nginx_http_response_size_bytes   # Response sizes
nginx_upstream_requests_total    # Upstream requests
```

#### Node Exporter

```
node_memory_MemAvailable_bytes   # Available memory
node_cpu_seconds_total           # CPU time
node_filesystem_avail_bytes      # Disk available
node_network_transmit_bytes_total # Network TX
node_network_receive_bytes_total  # Network RX
```

## Grafana Dashboards

### Pre-configured Datasources

- **Prometheus**: Automatically configured via provisioning

### Creating Dashboards

1. Log in to Grafana: http://localhost:3000
2. Create new dashboard
3. Add panels with Prometheus queries:

```promql
# Request rate (per second)
rate(http_requests_total[1m])

# Error rate
rate(http_requests_total{status=~"5.."}[1m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
```

## Alerting

### Alert Rules

Alerts are configured in `monitoring/alerts.yml`:

| Alert | Condition | Severity |
|-------|-----------|----------|
| InstanceDown | Service down > 5m | Critical |
| HighMemoryUsage | Memory > 85% for 10m | Warning |
| HighCPUUsage | CPU > 80% for 10m | Warning |
| HighDiskUsage | Disk > 85% for 5m | Critical |
| BackendHighErrorRate | Errors > 5% for 5m | Warning |
| DatabaseConnectionPoolExhausted | Connections > 80% for 5m | Warning |
| NginxHighErrorRate | 5xx errors for 5m | Warning |
| BackendResponseTimeHigh | P95 latency > 1s for 5m | Warning |

### View Alerts

1. **In Prometheus**: http://localhost:9090/alerts
2. **In Grafana**: Create alert rule or panel

### Configure Alerting

To enable alert notifications:

```yaml
# docker-compose.monitoring.yml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

### Webhook Integration (Example)

Send alerts to webhook:

```yaml
routes:
  - receiver: webhook
    group_by: ['alertname']

receivers:
  - name: webhook
    webhook_configs:
      - url: http://your-webhook-endpoint/alerts
```

## Monitoring Queries

### Performance Metrics

#### Request Rate
```promql
rate(http_requests_total[1m])
```

#### Error Rate
```promql
rate(http_requests_total{status=~"5.."}[1m]) / rate(http_requests_total[1m])
```

#### Response Time (P50, P95, P99)
```promql
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### System Metrics

#### CPU Usage
```promql
(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance)) * 100
```

#### Memory Usage
```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

#### Disk Usage
```promql
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
```

#### Network Traffic
```promql
rate(node_network_receive_bytes_total[1m])
rate(node_network_transmit_bytes_total[1m])
```

## Troubleshooting

### Prometheus not scraping targets

**Problem**: Targets show "DOWN" in Prometheus UI

**Solution**:
```bash
# Check target connectivity
docker-compose exec prometheus curl -f http://backend:8000/metrics

# Check prometheus logs
docker-compose logs prometheus | tail -50
```

### Grafana can't connect to Prometheus

**Problem**: "Data source is not responding" error

**Solution**:
```bash
# Verify network connectivity
docker-compose exec grafana curl -f http://prometheus:9090

# Check datasource configuration
# Go to Grafana → Configuration → Data Sources → Prometheus
```

### High disk usage

**Problem**: Prometheus consuming too much disk

**Solution**:
```bash
# Reduce retention period in docker-compose.monitoring.yml
--storage.tsdb.retention.time=7d

# Or manually purge old data
docker-compose exec prometheus promtool admin tsdb delete --min-time 0 --max-time 1234567890000
```

### Alerts not firing

**Problem**: Alert rules defined but not alerting

**Solution**:
1. Check alert rules syntax: `docker-compose exec prometheus promtool check rules /etc/prometheus/alerts.yml`
2. Verify alert condition: Check Prometheus Alerts page
3. Review metrics: Confirm metrics are being scraped

## Performance Tuning

### Optimize Prometheus

```yaml
# Reduce scrape interval for less critical targets
scrape_interval: 60s  # Default 15s

# Increase storage retention
--storage.tsdb.retention.time=30d

# Limit metrics cardinality
metric_relabel_configs:
  - source_labels: [__name__]
    regex: '(container|netdev)_.*'
    action: drop
```

### Optimize Grafana

```yaml
# Increase cache size
GF_PANELS_DISABLE_SANITIZE_HTML: "true"

# Enable persistent sessions
GF_AUTH_COOKIE_MAX_LIFETIME: 2592000
```

## Backup & Recovery

### Backup Prometheus Data

```powershell
# Backup prometheus volume
docker run --rm -v prometheus_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/prometheus_backup.tar.gz /data
```

### Restore Prometheus Data

```powershell
docker run --rm -v prometheus_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/prometheus_backup.tar.gz -C /
```

## Security Considerations

- **Default Credentials**: Change Grafana admin password
- **Network Access**: Restrict ports 9090, 3000, 9100 to internal networks
- **Data Sensitivity**: Metrics may contain sensitive performance data
- **Authentication**: Implement OAuth2/LDAP for Grafana in production

### Secure Grafana

```yaml
environment:
  - GF_SECURITY_ADMIN_PASSWORD=secure-password-here
  - GF_AUTH_OAUTH_ENABLED=true
  - GF_AUTH_OAUTH_SCOPES=openid profile email
```

## Monitoring Best Practices

1. **Alert on outcomes, not metrics**: Alert on error rate, not individual errors
2. **Set appropriate thresholds**: Based on SLOs and historical data
3. **Test alerts regularly**: Ensure notification channels work
4. **Document runbooks**: Link alerts to troubleshooting guides
5. **Review metrics regularly**: Identify trends and capacity planning needs
6. **Implement SLOs**: Define Service Level Objectives for your application
7. **Use meaningful names**: Dashboard names should be descriptive

## Next Steps

1. Create custom dashboards for your application
2. Configure alert notification channels (email, Slack, etc.)
3. Set up automated backups for monitoring data
4. Implement custom metrics collection in application
5. Integrate with incident management system

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Node Exporter Metrics](https://github.com/prometheus/node_exporter)
