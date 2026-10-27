#!/usr/bin/env bash
set -euo pipefail

source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
nas_target="${NAS_SSH_TARGET:-nas}"
remote_dir="/vol2/docker/freshli4-site-cache"
backup_dir="$remote_dir/state/service-before-$(date -u +%Y%m%dT%H%M%SZ)"

ssh "$nas_target" "mkdir -p '$remote_dir/cache/pages' '$remote_dir/cache/assets' '$remote_dir/state' '$remote_dir/logs' && chmod 700 '$remote_dir/state' '$remote_dir/logs'"
ssh "$nas_target" "mkdir -m 700 '$backup_dir'; for file in compose.yaml nginx.conf; do if [ -f '$remote_dir/'\"\$file\" ]; then cp -p '$remote_dir/'\"\$file\" '$backup_dir/'; fi; done"
# Keep the nginx bind mount's inode; nginx reload then sees the new content.
if rsync -a --inplace "$source_dir/compose.yaml" "$source_dir/nginx.conf" "$source_dir/dns.py" "$source_dir/verify.py" "$source_dir/renew-cert.sh" "$source_dir/gateway.py" "$source_dir/Caddyfile.fragment" "$source_dir/install-cron.py" "$nas_target:$remote_dir/" && \
   ssh "$nas_target" "cd '$remote_dir' && docker compose config --quiet && docker compose run --rm --no-deps cache -t && docker compose up -d && docker compose exec -T cache nginx -s reload"; then
  printf 'NAS cache deployed; previous configuration: %s\n' "$backup_dir"
else
  printf 'Cache deployment failed; restoring the previous service configuration.\n' >&2
  ssh "$nas_target" "for file in compose.yaml nginx.conf; do if [ -f '$backup_dir/'\"\$file\" ]; then cat '$backup_dir/'\"\$file\" > '$remote_dir/'\"\$file\"; fi; done; if [ -f '$backup_dir/compose.yaml' ]; then cd '$remote_dir' && docker compose up -d && docker compose exec -T cache nginx -s reload; fi"
  exit 1
fi
