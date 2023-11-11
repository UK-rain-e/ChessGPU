#!/bin/bash

set -e

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

sudo apt-get install stockfish

if [[ -z "$OPENAI_API_KEY" ]]; then
    echo "Error: OPENAI_API_KEY is not set. Please set it using env variable"
    exit 1
fi
