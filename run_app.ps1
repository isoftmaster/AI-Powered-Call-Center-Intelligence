# --- run_app.ps1 ---
# Launches the FastAPI backend on port 8001
# Ideal for quick demos and local testing

Write-Host "?? Frontend is a React App. Make sure to open another terminal to start it!"
Write-Host "Reminder: Open another terminal, cd into 'frontend', and run 'npm start'."
Write-Host "?? Starting FastAPI backend on http://localhost:8001 ..."

.\venv\Scripts\uvicorn.exe backend.main:app --reload --port 8001
