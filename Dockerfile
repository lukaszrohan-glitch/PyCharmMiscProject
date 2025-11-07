# Dockerfile for SMB Tool backend (FastAPI)
FROM python:3.11-slim

WORKDIR /app

# install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# copy requirements and install (prefer postgres requirements for production)
COPY requirements.txt requirements-dev.txt requirements-postgres.txt* ./
# Install postgres reqs if available, else fallback
RUN if [ -f requirements-postgres.txt ]; then pip install --no-cache-dir -r requirements-postgres.txt; else pip install --no-cache-dir -r requirements.txt; fi

# copy app
COPY . .

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# default command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
