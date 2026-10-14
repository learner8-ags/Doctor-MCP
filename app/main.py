import os
from fastapi import FastAPI
app=FastAPI(title='Job Runner')
def configured_timeout()->int:
    return int(os.getenv('JOB_TIMEOUT_SECONDS','30'))
@app.get('/health')
def health(): return {'status':'ok'}
@app.get('/api/job-config')
def config(): return {'timeout_seconds':configured_timeout()}
