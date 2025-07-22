#!/usr/bin/env bash
cd $(dirname "$0")
PYTHONPATH=src
python/venv/bin/python src/join_catalog.py
