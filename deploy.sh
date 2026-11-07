#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

for command_name in npm curl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$command_name" >&2
    exit 1
  fi
done

if ! command -v vercel >/dev/null 2>&1; then
  printf 'Vercel CLI is required. Install it with: npm install --global vercel\n' >&2
  exit 1
fi

: "${RENDER_DEPLOY_HOOK:?Set RENDER_DEPLOY_HOOK to the production Render deploy hook URL}"
: "${BACKEND_HEALTH_URL:?Set BACKEND_HEALTH_URL to the deployed backend /api/health URL}"

if [[ "${DEPLOY_ENV:-}" != "production" ]]; then
  printf 'Refusing to deploy: set DEPLOY_ENV=production to select the production environment.\n' >&2
  exit 1
fi

if [[ "${CONFIRM_PRODUCTION_DEPLOY:-}" != "YES" ]]; then
  if [[ ! -t 0 ]]; then
    printf 'Refusing a non-interactive production deploy. Set CONFIRM_PRODUCTION_DEPLOY=YES after review.\n' >&2
    exit 1
  fi
  printf 'This will deploy the backend to Render and the frontend to Vercel production.\n'
  printf 'It will not run database migrations. Type deploy-production to continue: '
  read -r confirmation
  if [[ "$confirmation" != "deploy-production" ]]; then
    printf 'Deployment cancelled.\n'
    exit 1
  fi
fi

cd "$ROOT_DIR"
printf '\nRunning backend tests...\n'
npm test -- --test-concurrency=1

printf '\nRunning frontend tests...\n'
npm test --prefix client

printf '\nChecking frontend lint...\n'
npm run lint --prefix client

printf '\nBuilding frontend...\n'
npm run build --prefix client

printf '\nTriggering Render deployment...\n'
curl --fail --silent --show-error --request POST "$RENDER_DEPLOY_HOOK" >/dev/null

printf 'Waiting for backend health at %s\n' "$BACKEND_HEALTH_URL"
healthy=0
for attempt in $(seq 1 60); do
  if curl --fail --silent --show-error "$BACKEND_HEALTH_URL" >/dev/null; then
    healthy=1
    break
  fi
  sleep 10
done

if [[ "$healthy" -ne 1 ]]; then
  printf 'Backend did not become healthy within 10 minutes. Frontend deployment was not started.\n' >&2
  exit 1
fi

printf '\nDeploying frontend to Vercel production...\n'
cd "$ROOT_DIR/client"
vercel --prod

printf '\nDeployment commands completed. Verify the live user flow and provider dashboards.\n'
