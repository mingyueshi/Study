"""PostgreSQL deployment; one worker because slider captcha uses the process-local cache."""
bind = '0.0.0.0:8012'
workers = 1
worker_class = 'gthread'
threads = 4
timeout = 90
graceful_timeout = 30
accesslog = '-'
errorlog = '-'
capture_output = True
# Django handles the explicitly enabled, trusted proxy header itself.
forwarded_allow_ips = ''
