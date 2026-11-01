#!/bin/bash
set -euo pipefail
umask 077
exec 9>/run/twice-backup.lock
flock -n 9 || exit 0
stamp=$(date -u +%Y%m%dT%H%M%SZ)
file=/srv/twice/backups/twice-$stamp.dump
docker exec twice-db-1 pg_dump -U twice -d twice -Fc > "$file"
python3 - "$file" "$stamp" <<'PY'
import sys,boto3,hashlib
p=sys.argv[1]
s3=boto3.client('s3',region_name='eu-north-1')
with open(p,'rb') as f:digest=hashlib.file_digest(f,'sha256').hexdigest()
s3.upload_file(p,'twice-demo-small-2026-artifacts-uouv3jytpvzc','backups/twice-'+sys.argv[2]+'.dump',ExtraArgs={'ServerSideEncryption':'AES256','Metadata':{'sha256':digest}})
print('Encrypted private database backup uploaded.')
PY
