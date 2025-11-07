import os
import pytest
from fastapi.testclient import TestClient
import db
import main

@pytest.fixture(scope="function", autouse=True)
def app_client():
    # Clean up the database file before running tests
    if os.path.exists("_dev_db.sqlite"):
        os.remove("_dev_db.sqlite")
    db.reset_sqlite_init()

    # Create a new TestClient for each test
    client = TestClient(main.app)
    yield client
