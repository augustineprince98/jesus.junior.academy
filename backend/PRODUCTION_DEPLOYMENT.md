# Production Deployment Guide
## Jesus Junior Academy ERP System

**Last Updated:** 2026-01-14
**Version:** 2.0.0
**Status:** Production Ready ✅

---

## 🎯 Pre-Deployment Checklist

### ✅ Issues Fixed
- [x] Fixed corrupted `app/schemas/marks_edit.py` (syntax error)
- [x] Fixed incorrect import in `app/routers/results.py`
- [x] Fixed incorrect import in `app/services/result_calculation_service.py`
- [x] Created proper router for results endpoint
- [x] Added production-ready middleware (CORS, logging, error handling)
- [x] Enhanced health check endpoint with database connectivity test
- [x] Verified all 19 API endpoints are operational
- [x] Database connectivity verified
- [x] All migrations up to date

### ✅ Production Enhancements Added
- [x] CORS middleware configuration
- [x] Request/response logging middleware
- [x] Global exception handlers (validation, database, general)
- [x] Enhanced health check endpoint
- [x] Root endpoint with API information
- [x] Proper logging configuration
- [x] Database connection pooling with pre-ping

---

## 🚀 Quick Start

### Development Mode
```bash
cd backend
python start_server.py --reload --host 127.0.0.1
```

### Production Mode
```bash
cd backend
python start_server.py --workers 4 --host 0.0.0.0 --port 8000
```

---

## 📋 System Requirements

### Software Dependencies
- **Python:** 3.10 or higher
- **PostgreSQL:** 13 or higher
- **Operating System:** Windows, Linux, or macOS

### Python Packages
See `requirements.txt` for complete list. Key dependencies:
- FastAPI
- Uvicorn
- SQLAlchemy
- Alembic
- PostgreSQL driver (psycopg2)
- Pydantic
- Python-JOSE (JWT)
- Passlib (password hashing)

---

## 🔧 Installation Steps

### 1. Clone Repository
```bash
git clone <repository-url>
cd school-website/backend
```

### 2. Create Virtual Environment
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/school_erp

# Security
JWT_SECRET=your-strong-random-secret-key-here

# Optional: Application Settings
APP_ENV=production
LOG_LEVEL=INFO
```

**Security Notes:**
- Generate a strong JWT_SECRET: `python -c "import secrets; print(secrets.token_hex(32))"`
- NEVER commit `.env` to version control
- Use different secrets for development and production

### 5. Database Setup

```bash
# Create PostgreSQL database
createdb school_erp

# Run migrations
alembic upgrade head
```

### 6. Verify Installation
```bash
python start_server.py --skip-checks
```

Visit: `http://localhost:8000/health`

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "database": "connected"
}
```

---

## 🌐 Production Deployment

### Option 1: Systemd Service (Linux)

Create `/etc/systemd/system/school-erp.service`:

```ini
[Unit]
Description=Jesus Junior Academy ERP API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/school-erp/backend
Environment="PATH=/var/www/school-erp/backend/.venv/bin"
ExecStart=/var/www/school-erp/backend/.venv/bin/python start_server.py --workers 4

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable school-erp
sudo systemctl start school-erp
sudo systemctl status school-erp
```

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run server
CMD ["python", "start_server.py", "--workers", "4"]
```

Build and run:
```bash
docker build -t school-erp:latest .
docker run -d -p 8000:8000 --env-file .env school-erp:latest
```

### Option 3: Nginx Reverse Proxy

Nginx configuration (`/etc/nginx/sites-available/school-erp`):

```nginx
server {
    listen 80;
    server_name api.school.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/school-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Security Hardening

### Environment Variables
- ✅ All secrets in `.env` file
- ✅ `.env` excluded from version control
- ⚠️ TODO: Restrict CORS origins in production (update `app/main.py`)

### Database Security
- Use strong PostgreSQL passwords
- Limit database user permissions
- Enable SSL for database connections in production
- Regular backups

### Application Security
- JWT tokens with secure secret
- Password hashing with bcrypt
- Input validation with Pydantic
- SQL injection protection via SQLAlchemy ORM
- Rate limiting (TODO: Consider adding)

### CORS Configuration
Update `app/main.py` line 40:
```python
allow_origins=["https://school.com", "https://admin.school.com"]  # Specific domains only
```

---

## 📊 Monitoring & Logging

### Health Checks
- Endpoint: `/health`
- Database connectivity check
- Use for load balancer health monitoring

### Logs
Application logs include:
- Request/response logging
- Error tracking
- Database errors
- Performance metrics (response time)

Production log configuration:
```python
# Add to app/main.py for production
import logging.handlers

handler = logging.handlers.RotatingFileHandler(
    "logs/app.log",
    maxBytes=10485760,  # 10MB
    backupCount=5
)
logging.basicConfig(handlers=[handler])
```

### Recommended Monitoring Tools
- **Application Performance:** New Relic, DataDog
- **Error Tracking:** Sentry
- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Log Aggregation:** ELK Stack, Grafana Loki

---

## 🧪 Testing Production Deployment

### 1. Health Check
```bash
curl http://localhost:8000/health
```

### 2. API Documentation
Visit: `http://localhost:8000/docs`

### 3. Authentication Test
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'
```

### 4. Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Run load test
ab -n 1000 -c 10 http://localhost:8000/health
```

---

## 📈 Performance Optimization

### Database
- Connection pooling enabled (SQLAlchemy)
- Add indexes on frequently queried columns
- Regular VACUUM and ANALYZE

### Application
- Multiple worker processes (4+ recommended)
- Response caching for static endpoints (optional)
- Compress responses (gzip)

### Infrastructure
- Use CDN for static assets
- Deploy geographically close to users
- Load balancing for high availability

---

## 🔄 Backup & Recovery

### Database Backup
```bash
# Daily backup
pg_dump school_erp > backup_$(date +%Y%m%d).sql

# Automated backup script
0 2 * * * /usr/bin/pg_dump school_erp > /backups/school_erp_$(date +\%Y\%m\%d).sql
```

### Restore
```bash
psql school_erp < backup_20260114.sql
```

### Application State
- `.env` file (secure backup)
- Database backups
- Static files (if any)

---

## 🆘 Troubleshooting

### Server Won't Start
1. Check database connectivity: `psql -U username -d school_erp`
2. Verify `.env` file exists and has correct values
3. Check Python version: `python --version` (should be 3.10+)
4. Review logs for specific errors

### Database Connection Errors
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check DATABASE_URL format
3. Test connection: `psql <DATABASE_URL>`
4. Check firewall rules

### Migration Errors
```bash
# Check current migration
alembic current

# Rollback one version
alembic downgrade -1

# Upgrade to latest
alembic upgrade head
```

### Performance Issues
1. Check worker count (should match CPU cores)
2. Monitor database query performance
3. Review application logs for slow endpoints
4. Consider adding caching

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Weekly: Review error logs
- [ ] Monthly: Update dependencies (`pip install --upgrade -r requirements.txt`)
- [ ] Quarterly: Security audit
- [ ] Annually: Review and update documentation

### Version Updates
1. Test in development environment
2. Backup database
3. Run migrations: `alembic upgrade head`
4. Deploy new code
5. Restart service
6. Verify health check

---

## ✨ Features

### API Endpoints (19 total)
1. **Authentication** (`/auth`)
   - Login
   - Password reset (request & verify)

2. **Admissions** (`/admissions`)
   - Enquiry management

3. **Enrollment** (`/enrollment`)
   - Student assignment

4. **Attendance** (`/attendance`)
   - Mark attendance

5. **Exams** (`/exams`)
   - Create exams
   - Set subject max marks

6. **Marks** (`/marks`)
   - Create subjects
   - Assign subjects to classes
   - Enter marks
   - Set exam subject max marks

7. **Marks Editing** (`/marks-edit`)
   - Request mark edits
   - Approve mark edits

8. **Results** (`/results`)
   - Student results calculation

9. **Promotion** (`/promotion`)
   - Class promotion

10. **Health** (`/health`)
    - System health check

---

## 🎓 System Architecture

```
┌─────────────────┐
│   Client Apps   │
│  (Web/Mobile)   │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│  Nginx Reverse  │
│     Proxy       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FastAPI App   │
│  (4 Workers)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│    Database     │
└─────────────────┘
```

---

## 📄 License & Credits

**Application:** Jesus Junior Academy ERP
**Version:** 2.0.0
**Framework:** FastAPI
**Database:** PostgreSQL
**Deployment Status:** Production Ready ✅

---

**Questions or Issues?**
Create an issue in the project repository or contact the development team.
