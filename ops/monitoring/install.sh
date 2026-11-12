#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="/opt/time2gather-monitoring"

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required" >&2
  exit 1
fi

if ! swapon --show=NAME --noheadings | grep -q .; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
fi

if ! grep -q '^/swapfile ' /etc/fstab; then
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

sudo install -m 0644 "$SOURCE_DIR/sysctl-monitoring.conf" /etc/sysctl.d/99-time2gather-monitoring.conf
sudo sysctl --system >/dev/null

sudo install -d -m 0755 "$INSTALL_DIR"
sudo install -m 0644 \
  "$SOURCE_DIR/compose.yml" \
  "$SOURCE_DIR/loki-config.yml" \
  "$SOURCE_DIR/alloy-config.alloy" \
  "$SOURCE_DIR/sysctl-monitoring.conf" \
  "$SOURCE_DIR/.env.example" \
  "$SOURCE_DIR/README.md" \
  "$INSTALL_DIR"/
sudo install -m 0755 \
  "$SOURCE_DIR/install.sh" \
  "$SOURCE_DIR/configure-telegram.sh" \
  "$INSTALL_DIR"/
sudo cp -R "$SOURCE_DIR/grafana" "$INSTALL_DIR"/
sudo chown -R root:root "$INSTALL_DIR"
sudo find "$INSTALL_DIR" -type d -exec chmod 0755 {} +
sudo find "$INSTALL_DIR" -type f ! -name .env -exec chmod 0644 {} +
sudo chmod 0755 "$INSTALL_DIR/install.sh" "$INSTALL_DIR/configure-telegram.sh"

if [[ ! -f "$INSTALL_DIR/.env" ]]; then
  env_file="$(mktemp)"
  trap 'rm -f "$env_file"' EXIT
  password="$(openssl rand -base64 36 | tr -d '\n')"
  umask 027
  printf '%s\n' "GRAFANA_ADMIN_PASSWORD=$password" 'TELEGRAM_BOT_TOKEN=' 'TELEGRAM_CHAT_ID=' > "$env_file"
  sudo install -o root -g docker -m 0640 "$env_file" "$INSTALL_DIR/.env"
fi
sudo chown root:docker "$INSTALL_DIR/.env"
sudo chmod 0640 "$INSTALL_DIR/.env"

cd "$INSTALL_DIR"
docker compose --env-file .env config --quiet
docker compose --env-file .env pull
docker compose --env-file .env up -d

echo "Monitoring stack installed in $INSTALL_DIR"
