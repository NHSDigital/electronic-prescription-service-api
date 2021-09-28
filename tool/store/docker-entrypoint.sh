#!/bin/sh
# Start Redis, using this overriding entrypoint modified from base container's version, see:
# https://github.com/docker-library/redis/blob/34eedfdcf45cc6b03328f68a67306f0cf77c4a20/6.2/alpine/docker-entrypoint.sh
set -e

if [ "${1#-}" != "$1" ] || [ "${1%.conf}" != "$1" ]; then
	set -- redis-server "$@"
fi

if [ "$1" = 'redis-server' -a "$(id -u)" = '0' ]; then
    # Custom: start go server healthcheck endpoint --
    sh -c /bin/server &
    # -----------------------------------------------
	find . \! -user redis -exec chown redis '{}' +
	exec su-exec redis "$0" "$@"
fi

exec "$@"