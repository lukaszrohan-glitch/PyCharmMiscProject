import os
import pytest
import tempfile
from fastapi.testclient import TestClient
import db
import main

@pytest.fixture(scope="function", autouse=True)
def app_client():
    # Use a unique temporary SQLite file per test to avoid file-locking on Windows
    # Create a temporary file and immediately close it (we just need the path)
    temp_db = tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False)
    temp_db_path = temp_db.name
    temp_db.close()

    # Set the temporary DB path for this test
    original_db_path = db.SQLITE_DB_PATH
    db.SQLITE_DB_PATH = temp_db_path
    db.reset_sqlite_init()

    # Force sqlite mode for tests
    os.environ["FORCE_SQLITE"] = "1"

    # Reset pool to ensure fresh connection with new DB path
    db.POOL = None

    # Create a new TestClient for each test
    client = TestClient(main.app)
    yield client

    # Cleanup: restore original path and remove temp file
    db.SQLITE_DB_PATH = original_db_path
    db.POOL = None
    try:
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)
    except PermissionError:
        # On Windows, file might still be locked; ignore
        pass
    finally:
        os.environ.pop("FORCE_SQLITE", None)
