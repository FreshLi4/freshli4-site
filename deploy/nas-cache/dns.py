#!/usr/bin/env python3
"""Manage only this cache's DNSPod records, using the NAS's existing credentials."""

import argparse
import ipaddress
import json
from pathlib import Path
import shlex
import urllib.error
import urllib.parse
import urllib.request

DOMAIN = "freshli4.com"
ORIGIN = "06a43d78bd7391ba.vercel-dns-017.com"
ROOT = Path(__file__).resolve().parent
STATE = ROOT / "state" / "dns-managed.json"
CREDENTIALS = Path("/vol2/docker/gitea/secrets/dnspod.env")


class DNSPod:
    def __init__(self):
        values = {}
        for line in CREDENTIALS.read_text().splitlines():
            line = line.strip().removeprefix("export ")
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key in ("DP_Id", "DP_Key"):
                values[key] = shlex.split(value)[0]
        self.token = values["DP_Id"] + "," + values["DP_Key"]

    def call(self, action, **fields):
        body = urllib.parse.urlencode({
            "login_token": self.token, "format": "json", "domain": DOMAIN, **fields,
        }).encode()
        request = urllib.request.Request(
            "https://dnsapi.cn/" + action, data=body,
            headers={"User-Agent": "FreshLi4-NAS-Cache/1.0"},
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.load(response)
        code = result.get("status", {}).get("code")
        if action == "Record.List" and code == "10":
            return {"records": []}
        if code != "1":
            raise RuntimeError(f"DNSPod {action} failed with status code {code}")
        return result

    def records(self, host):
        return self.call("Record.List", sub_domain=host).get("records", [])


def save(state):
    STATE.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    temporary = STATE.with_suffix(".tmp")
    temporary.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n")
    temporary.chmod(0o600)
    temporary.replace(STATE)


def source_ipv4(api):
    records = [r for r in api.records("git") if r["type"] == "A"
               and r["line"] == "默认" and r["status"] == "enable"]
    if len(records) != 1:
        raise RuntimeError("Expected exactly one enabled default git A record")
    return str(ipaddress.IPv4Address(records[0]["value"]))


def ensure_origin(api):
    records = [r for r in api.records("www") if r["line"] == "默认"]
    if len(records) != 1 or records[0]["type"] != "CNAME" or (
        records[0]["value"].rstrip(".") != ORIGIN
    ) or records[0]["status"] != "enable":
        raise RuntimeError("The default www Vercel record changed; review before activating")


def upsert(api, state, host, line, kind, value):
    key = host + ":" + line
    matches = [r for r in api.records(host) if r["line"] == line]
    owned_id = state["managed"].get(key)
    if matches:
        if len(matches) != 1 or matches[0]["id"] != owned_id:
            raise RuntimeError(f"Preserving an unmanaged DNS record at {key}")
        record = matches[0]
        if record["type"] != kind or record["status"] != "enable":
            raise RuntimeError(f"Managed record type/status changed at {key}; review required")
        if record["value"].rstrip(".") != value.rstrip("."):
            api.call("Record.Modify", record_id=owned_id, sub_domain=host,
                     record_type=kind, record_line=line, value=value, ttl=record["ttl"])
            print("Updated", key)
        return
    if owned_id:
        raise RuntimeError(f"Managed DNS record {key} disappeared; refusing to recreate it")
    try:
        result = api.call("Record.Create", sub_domain=host, record_type=kind,
                          record_line=line, value=value, ttl=600)
        record_id = result["record"]["id"]
    except (OSError, urllib.error.URLError):
        # A timed-out write can have succeeded. Reconcile before any retry.
        matches = [r for r in api.records(host) if r["line"] == line
                   and r["type"] == kind and r["value"].rstrip(".") == value.rstrip(".")]
        if len(matches) != 1:
            raise
        record_id = matches[0]["id"]
    state["managed"][key] = str(record_id)
    save(state)
    print("Created", key, "record", record_id)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("inspect", "prepare", "activate", "refresh", "rollback"))
    args = parser.parse_args()
    api = DNSPod()
    if args.action == "inspect":
        for host in ("www", "@", "cn-cache", "git"):
            records = [{k: r.get(k) for k in ("id", "name", "type", "line", "value", "ttl", "status")}
                       for r in api.records(host) if r["type"] in ("A", "AAAA", "CNAME")]
            print(host, json.dumps(records, ensure_ascii=False))
        return
    if STATE.exists():
        state = json.loads(STATE.read_text())
    elif args.action == "prepare":
        state = {"before": {host: api.records(host) for host in ("www", "@", "cn-cache")},
                 "managed": {}}
        save(state)
    else:
        raise RuntimeError("Run prepare before managing live DNS records")

    if args.action in ("prepare", "activate"):
        ensure_origin(api)
    if args.action in ("prepare", "activate", "refresh"):
        address = source_ipv4(api)
        upsert(api, state, "cn-cache", "默认", "A", address)
        if args.action == "activate":
            upsert(api, state, "www", "境内", "CNAME", "cn-cache.freshli4.com.")
            upsert(api, state, "@", "境内", "A", address)
        elif args.action == "refresh" and "@:境内" in state["managed"]:
            upsert(api, state, "@", "境内", "A", address)
    elif args.action == "rollback":
        # Removing our mainland overrides restores the untouched default Vercel records.
        for host in ("www", "@"):
            key = host + ":境内"
            record_id = state["managed"].get(key)
            if record_id is None:
                continue
            matches = [r for r in api.records(host) if r["id"] == record_id]
            if matches and matches[0]["line"] != "境内":
                raise RuntimeError(f"Record {record_id} changed lines; preserving it")
            if matches:
                api.call("Record.Remove", record_id=record_id)
            del state["managed"][key]
            save(state)
            print("Removed mainland override", host)


if __name__ == "__main__":
    main()
