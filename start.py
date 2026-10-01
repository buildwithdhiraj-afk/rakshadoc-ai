import os
import subprocess
import sys
import time
import threading
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.join(ROOT, "frontend")
BACKEND = os.path.join(ROOT, "backend")

if sys.platform == "win32":
    NPX = os.path.join(os.environ.get("ProgramFiles", r"C:\Program Files"), "nodejs", "npx.cmd")
else:
    NPX = "npx"

def start_backend():
    print("Starting backend on port 8000...", flush=True)
    subprocess.run([sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
                   cwd=BACKEND)

def start_frontend():
    time.sleep(3)
    print("Starting frontend on port 3000...", flush=True)
    subprocess.run([NPX, "next", "dev", "--port", "3000"], cwd=FRONTEND)

if __name__ == "__main__":
    errors = []

    def guard(fn):
        def wrapper():
            try:
                fn()
            except Exception as e:
                errors.append(e)
                print(f"{fn.__name__} failed: {e}", flush=True)
        return wrapper

    t1 = threading.Thread(target=guard(start_backend), daemon=True)
    t1.start()
    guard(start_frontend)()
