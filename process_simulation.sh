#!/usr/bin/env bash

if [ "$#" -eq 1 ]; then
  curl \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"job_id\":\"$1\"}" \
    --header "API-Key: $UPLOAD_QUEUE_SERVICE_API_KEY" \
    $UPLOAD_QUEUE_SERVICE_URL/upload/process/enqueue
elif [ "$#" -eq 2 ]; then
  curl \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"job_id\":\"$1\"}" \
    --header "API-Key: $UPLOAD_QUEUE_SERVICE_API_KEY" \
    $UPLOAD_QUEUE_SERVICE_URL/upload/process/enqueue/$2
else
    echo "Usage: $0 <job_id> or $0 <job_id> <catalog_id>"
    exit 1
fi
