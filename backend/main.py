from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import graphDB_router

app = FastAPI()

# Allow CORS for specific origins
origins = [
    "http://100.81.159.81:8080",
    "http://localhost:8080",
    "http://10.6.144.195:8080",
    "http://10.152.49.173:8080",
    "http://100.81.159.81:8080",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with prefixes
app.include_router(graphDB_router, prefix="/graphdb")
