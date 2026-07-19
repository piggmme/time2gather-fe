# Time2Gather log monitoring

This stack runs Grafana, Loki, and Grafana Alloy beside the production Compose project. It collects only containers in the `ubuntu` Compose project, keeps Loki data for seven days, and binds the UIs to localhost.

## Access Grafana

Open an SSH tunnel and visit `http://localhost:3001`:

```sh
ssh -N -L 3001:127.0.0.1:3001 -i ~/.ssh/time2gather ubuntu@ec2-52-79-173-101.ap-northeast-2.compute.amazonaws.com
```

The admin username is `admin`. The generated password is stored only in `/opt/time2gather-monitoring/.env` on the server.

## Connect Telegram

Create a Telegram bot with BotFather, add it to the destination chat, and obtain the chat ID. Then run this from an interactive SSH session:

```sh
/opt/time2gather-monitoring/configure-telegram.sh
```

The script validates the credentials by sending one test message before activating the Grafana contact point. The token and chat ID are stored in the server-only `.env` file and are not committed.

## Operations

```sh
cd /opt/time2gather-monitoring
docker compose --env-file .env ps
docker compose --env-file .env logs --tail 100 alloy loki grafana
```

The stack has a combined 1 GiB memory ceiling. The installer also creates a 2 GiB swap file with `vm.swappiness=10`. Application containers and the existing Caddy configuration are not modified.
