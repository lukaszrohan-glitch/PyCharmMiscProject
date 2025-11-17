
Write-Host "Add Monitoring Stack" -ForegroundColor Cyan
Write-Host "====================`n" -ForegroundColor Cyan

# Create docker-compose.monitoring.yml
$monitoringCompose = @"
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: smb_prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    networks:
      - smb_network

  grafana:
    image: grafana/grafana:latest
    container_name: smb_grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - smb_network

volumes:
  prometheus_data:
  grafana_data:

networks:
  smb_network:
    external: true
"@

$monitoringCompose | Out-File -FilePath "docker-compose.monitoring.yml" -Encoding UTF8
Write-Host "[OK] Created docker-compose.monitoring.yml" -ForegroundColor Green

# Create prometheus config
New-Item -ItemType Directory -Force -Path "monitoring" | Out-Null

$prometheusConfig = @"
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['smb_backend:8000']
"@

$prometheusConfig | Out-File -FilePath "monitoring/prometheus.yml" -Encoding UTF8
Write-Host "[OK] Created prometheus.yml" -ForegroundColor Green

Write-Host "`nTo start monitoring:" -ForegroundColor Cyan
Write-Host "docker-compose -f docker-compose.monitoring.yml up -d" -ForegroundColor Yellow
Write-Host "`nAccess:" -ForegroundColor Cyan
Write-Host "  Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "  Grafana: http://localhost:3000 (admin/admin)" -ForegroundColor White
