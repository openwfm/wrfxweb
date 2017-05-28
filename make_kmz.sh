#!/bin/bash
cd $(dirname "$0")
# which python
# echo $PATH
PYTHONPATH=src
python src/make_kmz.py $1 $2
if [ $? -eq 0 ] 
then 
    python src/join_catalog.py 
fi
