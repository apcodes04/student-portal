"""
Vercel Serverless Function Entry Point for FastAPI Application
"""
import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from app.main import app
except Exception as e:
    from fastapi import FastAPI
    app = FastAPI()
    
    @app.get("/{full_path:path}")
    @app.post("/{full_path:path}")
    def fallback(full_path: str = ""):
        return {"error": "Serverless Boot Exception", "details": str(e)}
