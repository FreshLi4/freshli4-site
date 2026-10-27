#!/bin/sh
set -eu

set -a
. /vol2/docker/gitea/secrets/dnspod.env
set +a

result=0
/vol2/docker/gitea/acme-home/acme.sh --renew -d www.freshli4.com --ecc \
  --home /vol2/docker/gitea/acme-home || result=$?
# acme.sh returns 2 when the certificate is not due for renewal.
if [ "$result" -ne 0 ] && [ "$result" -ne 2 ]; then
  exit "$result"
fi
