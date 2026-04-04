from pymongo import MongoClient
import os

# Connection is created once on import.
# dotenv must be loaded in app.py BEFORE this module is imported.
_client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/Nivedan"))
db = _client.get_default_database()
