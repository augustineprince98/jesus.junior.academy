"""
Gunicorn Configuration for Production

Optimized settings for running FastAPI with Uvicorn workers.
Use: gunicorn app.main:app -c gunicorn.conf.py
"""

import multiprocessing
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
backlog = 2048

# Workers
# Rule of thumb: 2 * num_cores + 1
# For serverless/container: keep it low (2-4)
workers = int(os.getenv("WEB_CONCURRENCY", 2))
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000  # Restart workers after N requests (prevents memory leaks)
max_requests_jitter = 50  # Add randomness to prevent all workers restarting at once

# Timeouts
timeout = 120  # Worker timeout
graceful_timeout = 30  # Time to wait for workers to finish
keepalive = 5  # Keep connections alive for 5 seconds

# Preload app for better memory usage (shared memory between workers)
preload_app = True

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = os.getenv("LOG_LEVEL", "info").lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)sμs'

# Process naming
proc_name = "jja-erp"

# Server mechanics
daemon = False  # Don't daemonize (for containers)
pidfile = None
user = None
group = None
tmp_upload_dir = None

# SSL (if not using reverse proxy)
# keyfile = None
# certfile = None


def on_starting(server):
    """Called just before the master process is initialized."""
    pass


def on_exit(server):
    """Called just before exiting Gunicorn."""
    pass


def worker_exit(server, worker):
    """Called when a worker exits."""
    pass


def post_fork(server, worker):
    """Called just after a worker has been forked."""
    # Re-seed random number generator
    import random
    random.seed()


def pre_request(worker, req):
    """Called just before a worker processes the request."""
    pass


def post_request(worker, req, environ, resp):
    """Called after a worker has finished processing a request."""
    pass
