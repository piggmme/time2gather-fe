#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="/opt/time2gather-monitoring"
ENV_FILE="$INSTALL_DIR/.env"
TEMPLATE="$INSTALL_DIR/grafana/provisioning/alerting/telegram.yml.template"
TARGET="$INSTALL_DIR/grafana/provisioning/alerting/telegram.yml"

if [[ ! -t 0 ]]; then
  echo "Run this script in an interactive SSH session." >&2
  exit 1
fi

read -rsp "Telegram bot token: " bot_token
echo
read -rp "Telegram chat ID: " chat_id

if [[ -z "$bot_token" || -z "$chat_id" ]]; then
  echo "Both Telegram values are required." >&2
  exit 1
fi

curl_config="$(mktemp)"
tmp_file="$(mktemp)"
trap 'rm -f "$curl_config" "$tmp_file"' EXIT
chmod 600 "$curl_config" "$tmp_file"
printf 'url = "https://api.telegram.org/bot%s/sendMessage"\n' "$bot_token" > "$curl_config"

if ! curl --config "$curl_config" -fsS --data-urlencode "chat_id=$chat_id" --data-urlencode "text=✅ Time2Gather monitoring Telegram 연결 테스트" >/dev/null; then
  echo "Telegram test message failed. Existing configuration was not changed." >&2
  exit 1
fi

grep -v '^TELEGRAM_' "$ENV_FILE" > "$tmp_file"
printf 'TELEGRAM_BOT_TOKEN=%s\nTELEGRAM_CHAT_ID=%s\n' "$bot_token" "$chat_id" >> "$tmp_file"
sudo install -o root -g docker -m 0640 "$tmp_file" "$ENV_FILE"
sudo install -o root -g root -m 0644 "$TEMPLATE" "$TARGET"

cd "$INSTALL_DIR"
docker compose --env-file .env up -d --force-recreate grafana

echo "Telegram contact point configured and test message sent."
