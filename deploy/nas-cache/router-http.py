#!/usr/bin/env python3
"""Add/remove the cache's HTTP-to-HTTPS redirect port without restarting the router."""

import argparse
from datetime import datetime, timezone
import json
import shlex
import subprocess

ENTRY = "FreshLi4-HTTP>80>192.168.0.2>10880>TCP>"
RULE = ["iptables", "-t", "nat", "-C", "VSERVER", "-p", "tcp", "-m", "tcp",
        "--dport", "80", "-j", "DNAT", "--to-destination", "192.168.0.2:10880"]


def remote(args, check=True):
    return subprocess.run(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=12",
                           "router", shlex.join(args)], text=True, capture_output=True, check=check)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("install", "remove"))
    args = parser.parse_args()
    current = remote(["nvram", "get", "vts_rulelist"]).stdout.strip()
    entries = current.split("<") if current else []
    conflicts = [entry for entry in entries if len(entry.split(">")) > 1
                 and entry.split(">")[1] == "80" and entry != ENTRY]
    if conflicts:
        raise RuntimeError("A different port-80 forward exists; preserving it")
    runtime = remote(RULE, check=False)
    if runtime.returncode not in (0, 1):
        raise RuntimeError("Could not inspect the cache's router forwarding rule")
    if args.action == "install":
        desired = entries if ENTRY in entries else entries + [ENTRY]
    else:
        desired = [entry for entry in entries if entry != ENTRY]
    updated = "<".join(desired)
    if updated != current:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        backup = "/vol2/docker/freshli4-site-cache/state/router-http-before-" + stamp + ".json"
        subprocess.run(["ssh", "nas", "umask 077; cat > " + shlex.quote(backup)],
                       input=json.dumps({"vts_rulelist": current}, indent=2) + "\n",
                       text=True, check=True)
        if remote(["nvram", "get", "vts_rulelist"]).stdout.strip() != current:
            raise RuntimeError("Router port forwards changed concurrently; preserving them")
        remote(["nvram", "set", "vts_rulelist=" + updated])
        remote(["nvram", "commit"])
    if args.action == "install" and runtime.returncode == 1:
        add = RULE.copy()
        add[3] = "-A"
        remote(add)
    elif args.action == "remove" and runtime.returncode == 0:
        remove = RULE.copy()
        remove[3] = "-D"
        remote(remove)
    print("HTTP redirect forwarding", args.action, "completed; existing forwards preserved")


if __name__ == "__main__":
    main()
