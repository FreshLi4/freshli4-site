#!/usr/bin/env python3
"""Check real cache responses without invoking a paid AI completion."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import time
import uuid

ORIGIN = "06a43d78bd7391ba.vercel-dns-017.com"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="http://127.0.0.1:8796")
    parser.add_argument("--check-expiry", action="store_true")
    args = parser.parse_args()

    with tempfile.TemporaryDirectory(prefix="freshli4-cache-check-") as temporary:
        root = Path(temporary)

        def fetch(path, *, origin=False, method="GET", headers=None, data=None):
            url = ("https://www.freshli4.com" if origin else args.base.rstrip("/")) + path
            command = ["curl", "-q", "--noproxy", "*", "--compressed", "-sS",
                       "--connect-timeout", "5", "--max-time", "20",
                       "-D", str(root / "headers"), "-o", str(root / "body"),
                       "-H", "Host: www.freshli4.com"]
            if origin:
                command += ["--connect-to", f"www.freshli4.com:443:{ORIGIN}:443"]
            if method == "HEAD":
                command.append("--head")
            elif method != "GET":
                command += ["-X", method]
            for key, value in (headers or {}).items():
                command += ["-H", key + ": " + value]
            if data is not None:
                command += ["--data-binary", data]
            subprocess.run(command + [url], check=True, capture_output=True)
            blocks = (root / "headers").read_text().strip().split("\n\n")
            lines = blocks[-1].splitlines()
            status = int(lines[0].split()[1])
            result_headers = {}
            for line in lines[1:]:
                if ":" in line:
                    key, value = line.split(":", 1)
                    result_headers[key.lower()] = value.strip()
            return status, result_headers, (root / "body").read_bytes()

        def same_response(actual, expected, path):
            assert actual[0] == expected[0], (path, actual[0], expected[0])
            assert hashlib.sha256(actual[2]).digest() == hashlib.sha256(expected[2]).digest(), path
            for name in ("content-type", "cache-control", "location", "x-robots-tag"):
                assert actual[1].get(name) == expected[1].get(name), (path, name)

        nonce = uuid.uuid4().hex
        home_path = "/?__nas_cache_check=" + nonce
        for path in (home_path, "/pitch-deck/?__nas_cache_check=" + nonce,
                     "/ball-maze/?__nas_cache_check=" + nonce,
                     "/games/investigation-delve/rules/?__nas_cache_check=" + nonce):
            expected = fetch(path, origin=True)
            assert expected[0] == 200, (path, expected[0])
            first, second = fetch(path), fetch(path)
            same_response(first, expected, path)
            same_response(second, expected, path)
            assert first[1].get("x-freshli4-cache") == "MISS", (path, first[1])
            assert second[1].get("x-freshli4-cache") == "HIT", (path, second[1])
            print("PASS body/headers and MISS -> HIT:", path.split("?")[0], flush=True)

        homepage = fetch(home_path)
        scripts = re.findall(rb'<script[^>]+src="(/assets/[^\"]+)"', homepage[2])
        assert scripts, "Homepage has no fingerprinted application script"
        asset_path = scripts[0].decode() + "?__nas_cache_check=" + nonce
        expected = fetch(asset_path, origin=True)
        first, second = fetch(asset_path), fetch(asset_path)
        same_response(first, expected, asset_path)
        same_response(second, expected, asset_path)
        assert first[1].get("x-freshli4-cache") == "MISS"
        assert second[1].get("x-freshli4-cache") == "HIT"
        assert fetch(asset_path, method="HEAD")[1].get("x-freshli4-cache") == "HIT"
        print("PASS fingerprinted asset and HEAD cache", flush=True)

        for headers in ({"Authorization": "Cache-Check"}, {"Cookie": "cache_check=1"},
                        {"Cache-Control": "no-cache"}, {"Range": "bytes=0-31"}):
            result = fetch(asset_path, headers=headers)
            assert result[1].get("x-freshli4-cache") == "BYPASS", headers.keys()
        print("PASS authorization/cookie/reload/range bypass", flush=True)

        for method, data in (("GET", None), ("POST", json.dumps({"question": ""}))):
            headers = {"Content-Type": "application/json"} if method == "POST" else {}
            expected = fetch("/api/rules-ai", origin=True, method=method, headers=headers, data=data)
            assert expected[0] == (405 if method == "GET" else 400), (method, expected[0])
            for _ in range(2):
                result = fetch("/api/rules-ai", method=method, headers=headers, data=data)
                same_response(result, expected, "/api/rules-ai")
                assert result[1].get("x-freshli4-cache") == "BYPASS"
        print("PASS API method/status/body passthrough; no AI completion requested", flush=True)

        for path in ("/.well-known/vercel/cache-check", "/_vercel/cache-check"):
            assert fetch(path)[1].get("x-freshli4-cache") == "BYPASS", path
        print("PASS Vercel verification routes bypass", flush=True)

        if args.check_expiry:
            # The command runs asynchronously while waiting for the real 60s TTL.
            expiry_path = "/?__nas_cache_expiry=" + nonce
            assert fetch(expiry_path)[1].get("x-freshli4-cache") == "MISS"
            assert fetch(expiry_path)[1].get("x-freshli4-cache") == "HIT"
            print("Waiting 62s for page cache expiry...", flush=True)
            time.sleep(62)
            result = fetch(expiry_path)
            assert result[1].get("x-freshli4-cache") in ("STALE", "EXPIRED"), result[1]
            for _ in range(10):
                time.sleep(1)
                result = fetch(expiry_path)
                if result[1].get("x-freshli4-cache") == "HIT":
                    break
            assert result[1].get("x-freshli4-cache") == "HIT", result[1]
            print("PASS page expiry and background refresh", flush=True)


if __name__ == "__main__":
    main()
