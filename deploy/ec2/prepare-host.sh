#!/bin/bash
set -euo pipefail
umask 077
bucket=$1
region=$2
expected_sha=$3
release=/srv/twice/release
cloud-init status --wait >/dev/null
# Bootstrap only: its app override opens signup, and a running Caddy would publish it.
if docker ps --format '{{.Names}}' | grep -q caddy; then
  echo "Caddy is running: this is a live host. prepare-host.sh is first-boot bootstrap only; refusing." >&2
  exit 1
fi
command -v docker >/dev/null
docker compose version
install -d -m 700 "$release" /srv/twice/postgres /srv/twice/caddy-data /srv/twice/caddy-config /srv/twice/backups
python3 - "$bucket" "$region" <<'PY'
import sys,boto3
s3=boto3.client('s3',region_name=sys.argv[2])
s3.download_file(sys.argv[1],'artifacts/twice-arm64-images.tar.gz','/srv/twice/images.tar.gz')
s3.download_file(sys.argv[1],'artifacts/twice-deploy-config.tar.gz','/srv/twice/config.tar.gz')
PY
printf '%s  %s\n' "$expected_sha" /srv/twice/images.tar.gz | sha256sum -c -
docker load -i /srv/twice/images.tar.gz >/dev/null
docker image inspect twice:ec2-review twice:migration --format '{{.Id}} {{.Architecture}}'
tar -xzf /srv/twice/config.tar.gz -C "$release"
install -d -m 700 "$release/deploy/private"
python3 - "$region" "$release/deploy/private" <<'PY'
import sys,os,boto3,urllib.parse
from pathlib import Path
text=boto3.client('ssm',region_name=sys.argv[1]).get_parameter(Name='/twice/demo/app-env',WithDecryption=True)['Parameter']['Value']
p=Path(sys.argv[2]);f=p/'app.env';f.write_text(text);os.chmod(f,0o600)
values=dict(line.split('=',1) for line in text.splitlines() if line and not line.startswith('#'))
pw=urllib.parse.unquote(urllib.parse.urlsplit(values['DATABASE_URL']).password)
f=p/'db_password';f.write_text(pw+'\n');os.chmod(f,0o600)
PY
cd "$release"
export TWICE_IMAGE=twice:ec2-review
base=(docker compose -f deploy/ec2/compose.yaml)
"${base[@]}" stop app || true
"${base[@]}" up -d db
"${base[@]}" run --rm --no-deps migrate
"${base[@]}" -f deploy/ec2/compose.bootstrap.yaml up -d --no-build app
df -h /srv/twice
