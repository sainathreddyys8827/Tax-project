import pytest
import mongomock
from app import create_app
from app.db import get_database


@pytest.fixture
def app(monkeypatch):
    """Create a Flask app configured for testing and patch MongoClient to use mongomock."""
    # patch the MongoClient in app.models.database before the app is created
    monkeypatch.setattr('app.models.database.MongoClient', mongomock.MongoClient)

    app = create_app('testing')
    return app


def test_database_initialization(app):
    """The database should initialize and allow basic insert/find operations."""
    with app.app_context():
        db = get_database()
        assert db is not None

        # insert a dummy document
        result = db.db.test_collection.insert_one({'foo': 'bar'})
        assert result.inserted_id is not None

        # retrieve it back
        doc = db.db.test_collection.find_one({'foo': 'bar'})
        assert doc is not None
        assert doc['foo'] == 'bar'


def test_multiple_inserts_and_query(app):
    with app.app_context():
        db = get_database()
        for i in range(5):
            db.db.sample.insert_one({'index': i})
        count = db.db.sample.count_documents({})
        assert count == 5
