#!/usr/bin/env python3
"""Update only the marked FreshLi4 block in the existing Caddy gateway."""

import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
CONFIG = Path("/vol2/docker/gitea/Caddyfile")
BEGIN = "# BEGIN freshli4-site-cache"
END = "# END freshli4-site-cache"


def run(command, log):
    result = subprocess.run(command, text=True, capture_output=True)
    log.write_text(result.stdout + result.stderr)
    log.chmod(0o600)
    if result.returncode:
        raise RuntimeError(f"Gateway command failed ({result.returncode}); details in {log}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("install", "remove"))
    args = parser.parse_args()
    previous = CONFIG.read_text()
    if previous.count(BEGIN) != previous.count(END) or previous.count(BEGIN) > 1:
        raise RuntimeError("Gateway markers are inconsistent; preserving the configuration")
    if BEGIN in previous:
        start, finish = previous.index(BEGIN), previous.index(END) + len(END)
        if finish < start:
            raise RuntimeError("Gateway marker order is invalid")
        replacement = (ROOT / "Caddyfile.fragment").read_text().rstrip() if args.action == "install" else ""
        candidate = previous[:start] + replacement + previous[finish:]
    elif args.action == "remove":
        print("Gateway block already absent")
        return
    else:
        candidate = previous.rstrip() + "\n\n" + (ROOT / "Caddyfile.fragment").read_text()
    if candidate == previous:
        print("Gateway block already current")
        return

    state = ROOT / "state"
    state.mkdir(mode=0o700, exist_ok=True)
    staged = state / "Caddyfile.candidate"
    staged.write_text(candidate)
    staged.chmod(0o600)
    subprocess.run(["docker", "cp", str(staged), "gitea-caddy:/tmp/freshli4-cache.Caddyfile"], check=True)
    run(["docker", "exec", "gitea-caddy", "caddy", "validate", "--config",
         "/tmp/freshli4-cache.Caddyfile", "--adapter", "caddyfile"], state / "gateway-validation.log")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = state / ("Caddyfile.before-" + stamp)
    # Preserve the bind-mounted file's inode so the running container sees updates.
    with CONFIG.open("r+") as target:
        fcntl.flock(target, fcntl.LOCK_EX)
        actual = target.read()
        if actual != previous:
            raise RuntimeError("Gateway changed concurrently; preserving it and stopping")
        backup.write_text(previous)
        backup.chmod(0o600)
        target.seek(0)
        target.write(candidate)
        target.truncate()
        target.flush()
    try:
        run(["docker", "exec", "gitea-caddy", "caddy", "reload", "--config",
             "/etc/caddy/Caddyfile", "--adapter", "caddyfile"], state / "gateway-reload.log")
    except RuntimeError:
        with CONFIG.open("r+") as target:
            fcntl.flock(target, fcntl.LOCK_EX)
            if target.read() != candidate:
                raise RuntimeError("Gateway reload failed and config changed concurrently; review required")
            target.seek(0)
            target.write(previous)
            target.truncate()
            target.flush()
        run(["docker", "exec", "gitea-caddy", "caddy", "reload", "--config",
             "/etc/caddy/Caddyfile", "--adapter", "caddyfile"], state / "gateway-restore.log")
        raise
    print("Gateway validated and reloaded; previous configuration:", backup)
    print("Gateway SHA256:", hashlib.sha256(candidate.encode()).hexdigest())


if __name__ == "__main__":
    main()
