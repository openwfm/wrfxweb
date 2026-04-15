#!/usr/bin/env bash

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <job_id>"
    exit 1
fi

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"job_id\":\"$1\"}" \
  --header "API-Key: $UPLOAD_QUEUE_SERVICE_API_KEY" \
  $UPLOAD_QUEUE_SERVICE_URL/upload/process/enqueue/public

