#!/bin/bash
set -euo pipefail

case "$(uname -s)" in
  Linux*)
    echo "Installing k6 for Linux/WSL..."
    sudo gpg -k
    sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
      --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
    echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
      | sudo tee /etc/apt/sources.list.d/k6.list
    sudo apt-get update
    sudo apt-get install -y k6
    ;;
  Darwin*)
    echo "macOS detected. Install k6 with:"
    echo "  brew install k6"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    echo "Windows detected. Run PowerShell as administrator:"
    echo "  choco install k6"
    ;;
  *)
    echo "Unsupported OS. See https://grafana.com/docs/k6/latest/set-up/install-k6/"
    ;;
esac

echo
echo "Install commands by OS:"
echo "  Linux/WSL: scripts/install-k6.sh"
echo "  macOS:     brew install k6"
echo "  Windows:   choco install k6"
