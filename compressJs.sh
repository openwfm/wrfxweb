#!/bin/bash

find ./fdds/js -name "*.js" -exec gzip -k {} \;

