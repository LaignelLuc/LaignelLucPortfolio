#!/bin/zsh
# Serve this folder over HTTP so ES modules and .glb files are allowed.
# The port is the first free one from 8000 upwards: if something already listens
# on 8000, python would exit and the browser would open the wrong page.
cd "$(dirname "$0")" || exit 1

PORT=8000
while lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

echo "PortfolioWeb → http://127.0.0.1:$PORT"
echo "Ctrl+C to stop."

python3 -m http.server "$PORT" --bind 127.0.0.1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT INT TERM

# Only open the page once the server actually answers.
for _ in {1..40}; do
  curl -fs -o /dev/null "http://127.0.0.1:$PORT/index.html" && break
  sleep 0.1
done

open -a "Zen" "http://127.0.0.1:$PORT" 2>/dev/null || open "http://127.0.0.1:$PORT"
wait "$SERVER_PID"
