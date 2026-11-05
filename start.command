#!/bin/zsh
# Serve this folder over HTTP so ES modules and .glb files are allowed.
cd "$(dirname "$0")" || exit 1

PORT=8000
echo "Serving PortfolioWeb at http://127.0.0.1:$PORT"
echo "Press Ctrl+C to stop."

python3 -m http.server "$PORT" --bind 127.0.0.1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT INT TERM
sleep 0.5

open -a "Zen" "http://127.0.0.1:$PORT" 2>/dev/null || open "http://127.0.0.1:$PORT"
wait "$SERVER_PID"
