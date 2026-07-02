#!/bin/bash

echo "========================================"
echo " Starting Three.js Scene Demo Server"
echo "========================================"
echo ""
echo " Server will start at:"
echo " http://localhost:8000"
echo ""
echo " Press Ctrl+C to stop the server"
echo ""
echo "========================================"
echo ""

# Get the directory where this script is located
cd "$(dirname "$0")"

# Start the HTTP server
python3 -m http.server 8000
