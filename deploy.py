#!/usr/bin/env python3
import subprocess
import os
import sys
import shutil

SSH_HOST = "serwer2581752@serwer2581752.home.pl"
SSH_PORT = 22222
PASSWORD = "Kasienka#89"

def run(cmd, shell=False):
    """Run command and return output"""
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=shell, capture_output=False, text=True)
    return result.returncode == 0

def main():
    os.chdir(r"C:\Users\lukas\PyCharmMiscProject")
    
    print("================================")
    print("Deploying Application NOW")
    print("================================")
    print()
    
    # Step 1: Build frontend
    print("Step 1: Building frontend...")
    if not run("cd frontend && npm run build && cd .."):
        print("[ERROR] Build failed")
        return False
    print("[OK] Frontend built")
    print()
    
    # Step 2: Create archive
    print("Step 2: Creating deployment archive...")
    files = [
        "docker-compose.yml", "Dockerfile", "nginx.conf", ".env", "entrypoint.sh",
        "alembic.ini", "requirements.txt", "main.py", "auth.py", "db.py",
        "schemas.py", "queries.py", "user_mgmt.py", "logging_utils.py",
        "frontend/dist", "alembic", "scripts"
    ]
    
    if os.path.exists("deploy-app.zip"):
        os.remove("deploy-app.zip")
    
    run(f'powershell -Command "Compress-Archive -Path @({chr(34)}{chr(34).join(files)}{chr(34)}) -DestinationPath deploy-app.zip -Force"')
    print("[OK] Archive created")
    print()
    
    # Step 3: Upload
    print("Step 3: Uploading to server...")
    print(f"SSH command: scp -P {SSH_PORT} deploy-app.zip {SSH_HOST}:~/arkuszownia/")
    run(f"scp -P {SSH_PORT} deploy-app.zip {SSH_HOST}:~/arkuszownia/", shell=True)
    print("[OK] Upload complete")
    print()
    
    # Step 4: Deploy
    print("Step 4: Starting application...")
    deploy_cmd = f"""ssh -p {SSH_PORT} {SSH_HOST} "cd ~/arkuszownia && unzip -o deploy-app.zip && mkdir -p logs/{{nginx,cloudflared}} && docker-compose down 2>/dev/null; docker-compose up -d && sleep 15 && docker-compose ps" """
    run(deploy_cmd, shell=True)
    
    print()
    print("================================")
    print("Deployment Complete!")
    print("================================")
    print()
    print("Access your app:")
    print("  Backend: http://serwer2581752.home.pl:8000")
    print("  Frontend: http://serwer2581752.home.pl:8088")
    print()
    
    if os.path.exists("deploy-app.zip"):
        os.remove("deploy-app.zip")
    
    return True

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nCancelled")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)
