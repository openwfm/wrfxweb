#!/bin/bash
cd $(dirname "$0")
# which python
# echo $PATH
PYTHONPATH=src
python/venv/bin/python src/make_zip.py $*
if [ $? -eq 0 ] 
then 
    python/venv/bin/python src/join_catalog.py 
fi
