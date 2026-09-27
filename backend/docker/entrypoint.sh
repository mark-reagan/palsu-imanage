#!/bin/sh
set -eu

PORT="${PORT:-10000}"
REVERB_SERVER_HOST="${REVERB_SERVER_HOST:-0.0.0.0}"
REVERB_SERVER_PORT="${REVERB_SERVER_PORT:-8080}"
QUEUE_WORKER_TIMEOUT="${QUEUE_TIMEOUT:-60}"
QUEUE_WORKER_TRIES="${QUEUE_TRIES:-3}"

# Render assigns PORT dynamically; make both Apache listeners match it.
sed -i "s/10000/${PORT}/g" /etc/apache2/ports.conf /etc/apache2/sites-available/laravel.conf

mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/framework/testing \
    storage/logs \
    bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache

# Render's free web services do not provide a pre-deploy command. Apply any
# pending database migrations before Apache starts serving requests.
php artisan migrate --force
php artisan db:seed --force

# Start Reverb only when the app is configured for it.
if [ "${BROADCAST_CONNECTION:-}" = "reverb" ] || [ -n "${REVERB_APP_KEY:-}" ] || [ -n "${REVERB_APP_SECRET:-}" ]; then
    echo "Starting Laravel Reverb..."
    php artisan reverb:start --host "${REVERB_SERVER_HOST}" --port "${REVERB_SERVER_PORT}" > /tmp/reverb.log 2>&1 &
fi

# Start the queue worker unless the queue is explicitly disabled.
if [ "${QUEUE_CONNECTION:-sync}" != "sync" ] && [ "${QUEUE_CONNECTION:-sync}" != "null" ]; then
    echo "Starting Laravel queue worker..."
    php artisan queue:work --tries="${QUEUE_WORKER_TRIES}" --timeout="${QUEUE_WORKER_TIMEOUT}" --sleep=3 > /tmp/queue-worker.log 2>&1 &
fi

exec apache2-foreground
