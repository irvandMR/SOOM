# Docker Deployment Quick Start

## Prerequisites

- Docker Desktop installed (or Docker + Docker Compose)
- 2GB+ available RAM
- Ports 5432, 6379, 8081, 80 available

## Quick Start (5 minutes)

### Step 1: Setup Environment
```bash
cd SOOM
cp .env.example .env
```

Edit `.env` and update these critical values:
```env
DB_PASSWORD=your_secure_password
JWT_SECRET=your_generated_secret_key
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
VITE_API_URL=http://localhost:8081/api/v1
```

### Step 2: Start Services
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### Step 3: Access Application
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8081/api/v1
- **Health Check**: http://localhost:8081/api/health
- **Database**: localhost:5432
- **Redis**: localhost:6379

### Step 4: Verify Installation
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Test API
curl http://localhost:8081/api/health
```

## Default Credentials

Setelah database migration selesai:
- **Username**: admin@soom.local
- **Password**: Check backend logs atau database untuk default password

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]
# Services: backend, frontend, db, redis

# Rebuild images
docker-compose build --no-cache

# Connect to database
docker-compose exec db psql -U postgres -d soom_db

# View Redis
docker-compose exec redis redis-cli

# Restart specific service
docker-compose restart backend

# Remove everything (including data!)
docker-compose down -v
```

## Troubleshooting

### Backend fails to start
```bash
docker-compose logs backend
# Check: DB_PASSWORD, JWT_SECRET, REDIS settings
```

### Database connection error
```bash
# Verify database is running
docker-compose ps db

# Check logs
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d db
```

### Frontend not loading
```bash
# Verify Nginx config
docker-compose logs frontend

# Check API URL in browser console
# Should match VITE_API_URL in .env
```

### Port already in use
```bash
# Find service using port
netstat -tulpn | grep :8081

# Change ports in docker-compose.yml or stop other services
```

## Production Considerations

1. **Never use default passwords**
2. **Generate strong JWT_SECRET**: `openssl rand -base64 32`
3. **Use HTTPS** with valid SSL certificate
4. **Set up regular backups** for PostgreSQL
5. **Configure monitoring** (Prometheus, ELK stack, etc.)
6. **Enable Redis persistence** for caching
7. **Review CORS settings** for your domain
8. **Set resource limits** in docker-compose.yml

## Environment Variables Reference

| Variable | Default | Required | Notes |
|----------|---------|----------|-------|
| DB_HOST | db | Yes | PostgreSQL hostname |
| DB_PORT | 5432 | Yes | PostgreSQL port |
| DB_NAME | soom_db | Yes | Database name |
| DB_USERNAME | postgres | Yes | DB user |
| DB_PASSWORD | postgres | Yes | ⚠️ Change for production |
| REDIS_HOST | redis | Yes | Redis hostname |
| REDIS_PORT | 6379 | Yes | Redis port |
| REDIS_PASSWORD | (empty) | No | Redis password |
| JWT_SECRET | default | Yes | ⚠️ Must change for production |
| JWT_EXPIRATION | 900000 | No | Token expiration in ms (15 min) |
| JWT_REFRESH_EXPIRATION | 604800000 | No | Refresh token expiration (7 days) |
| MAIL_HOST | smtp.gmail.com | No | Email server |
| MAIL_USERNAME | (placeholder) | No | Email username |
| MAIL_PASSWORD | (placeholder) | No | App password |
| VITE_API_URL | http://localhost:8081/api/v1 | No | Frontend API URL |

## Performance Tuning

```yaml
# Add to docker-compose.yml services
resources:
  limits:
    cpus: '1'
    memory: 512M
  reservations:
    cpus: '0.5'
    memory: 256M
```

## Data Persistence

Database and Redis data are stored in Docker volumes:
- `postgres_data`: PostgreSQL database files
- Default location: `/var/lib/docker/volumes/`

To backup:
```bash
docker-compose exec db pg_dump -U postgres soom_db > backup.sql
```

To restore:
```bash
docker-compose exec -T db psql -U postgres soom_db < backup.sql
```

## Health Checks

The application includes health check endpoint:
```bash
# All services healthy
curl http://localhost:8081/api/health
# Response: "SOOM Backend is Running"
```

## Cleanup

```bash
# Stop and remove containers (keep data)
docker-compose down

# Stop and remove everything (including data!)
docker-compose down -v

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune
```

## Next Steps

After successful deployment:
1. Change admin password
2. Configure email settings
3. Set up monitoring
4. Configure backups
5. Document deployment procedure
6. Train team on operations
