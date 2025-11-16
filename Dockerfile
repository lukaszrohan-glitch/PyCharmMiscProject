# Dockerfile for SMB Tool (FastAPI + React SPA)
# Node.js build stage for frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend . 
RUN npm run build

# Python builder stage
FROM python:3.11-slim AS python-builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        python3-dev \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Final stage
FROM python:3.11-slim

# Copy virtual environment from python-builder
COPY --from=python-builder /opt/venv /opt/venv

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install runtime dependencies and setup user
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 curl bash \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -s /bin/bash app \
    && mkdir -p /app/frontend \
    && chown -R app:app /app

# Set working directory
WORKDIR /app

# Copy application code
COPY --chown=app:app . .

# Copy frontend dist from frontend-builder
COPY --chown=app:app --from=frontend-builder /frontend/dist ./frontend/dist

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Add entrypoint script and ensure executable
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/healthz || exit 1

# Expose port
EXPOSE 8000

# Environment variables
ENV DATABASE_URL=""

# Run via entrypoint to wait for DB and run migrations
CMD ["sh", "/app/entrypoint.sh"]
