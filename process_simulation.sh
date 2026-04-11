#!/usr/bin/env bash

# Check if the number of arguments is not equal to 2
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <job_id> <catalog_id>"
    exit 1
fi

python/venv/bin/python python/scripts/reprocess_simulations.py $1 $2
