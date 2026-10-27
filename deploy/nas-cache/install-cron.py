#!/usr/bin/env python3
"""Install only the cache's DDNS and DNS-01 certificate renewal schedules."""

from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent
result = subprocess.run(["crontab", "-l"], text=True, capture_output=True)
if result.returncode not in (0, 1):
    raise RuntimeError("Could not read existing crontab")
entries = {
    "# freshli4-site-cache-ddns":
        f"*/5 * * * * /usr/bin/python3 {root}/dns.py refresh >>{root}/logs/ddns.log 2>&1",
    "# freshli4-site-cache-cert":
        f"29 4 * * * /bin/sh {root}/renew-cert.sh >>{root}/logs/cert-renew.log 2>&1",
}
lines = [line for line in result.stdout.splitlines()
         if not any(line.rstrip().endswith(marker) for marker in entries)]
lines.extend(command + " " + marker for marker, command in entries.items())
updated = "\n".join(lines) + "\n"
if updated != result.stdout:
    backup = root / "state" / "crontab.before-cache"
    if not backup.exists():
        backup.write_text(result.stdout)
        backup.chmod(0o600)
    current = subprocess.run(["crontab", "-l"], text=True, capture_output=True)
    if current.stdout != result.stdout:
        raise RuntimeError("Crontab changed concurrently; preserving it")
    subprocess.run(["crontab", "-"], input=updated, text=True, check=True)
print("Cache DDNS every 5 minutes; certificate renewal at 04:29 NAS local time")
