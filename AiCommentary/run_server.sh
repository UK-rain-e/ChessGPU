#!/bin/bash
source .venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 5539 --ssl-keyfile=./key.pem --ssl-certfile=./cert.pem
