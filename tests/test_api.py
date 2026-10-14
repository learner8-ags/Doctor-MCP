from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_default_timeout_is_30(monkeypatch):
    monkeypatch.delenv('JOB_TIMEOUT_SECONDS',raising=False); monkeypatch.delenv('HPE_JOB_TIMEOUT_SEC',raising=False)
    assert client.get('/api/job-config').json()['timeout_seconds']==30
