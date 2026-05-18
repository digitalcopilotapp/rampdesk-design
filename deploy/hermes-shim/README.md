# Hermes ACP shim

A tiny Node.js binary that makes Open Design's daemon detect "Hermes" as an
available ACP-protocol agent inside the Docker container.

## What it does

1. Bound at `/opt/hermes-shim/hermes` via docker-compose bind-mount.
2. Container PATH starts with `/opt/hermes-shim` so `hermes --version` works.
3. When OD spawns `hermes acp --accept-hooks`, the shim:
   - Handshakes ACP JSON-RPC v1 (initialize, newSession)
   - On each `prompt`, POSTs to the host's claude-shim at
     `http://host.docker.internal:8088/v1/chat/completions`
   - Streams the reply back as `session/update` notifications

The claude-shim on the host runs the local `claude` CLI via Max OAuth, so
every Hermes ACP call costs $0 in API charges.

## Env

- `HERMES_SHIM_TARGET` — override claude-shim URL (default uses host.docker.internal:8088)
- `HERMES_SHIM_MODEL` — `sonnet` | `opus` | `haiku` (default: sonnet)

## Limitations

- No streaming token output — full reply arrives at once (claude-shim's
  non-stream mode).
- No tool use surface yet — OD's daemon owns tool dispatch separately.
- `models` source is "fallback" in OD's registry because we don't query
  ACP model-list; the static list in initialize is good enough.
