#!/bin/sh
# Makes a container of OpenCloud's Yjs server (opencloudeu/yjs) run CERNBox's
# entry point, cernbox-server.ts, which adds live editing for public links, and
# restarts it. The file takes the place of the image's src/server.ts inside the
# container, so the compose file stays OpenCloud's. The change lives in the
# container: run this again after the container is recreated, for example by
# `docker compose up --force-recreate` or a new image version.
#
# Usage: patch-container.sh [container]      (default: yjs)
#        DOCKER=podman patch-container.sh <container>
set -eu

container=${1:-yjs}
docker=${DOCKER:-docker}
server="$(dirname "$0")/cernbox-server.ts"

# cernbox-server.ts is OpenCloud's server.ts of 1.1.1 plus public links, and
# uses that version's libraries. Another image is refused until
# cernbox-server.ts has been checked against it.
opencloud_server_sha256=b45bee68dd0dcd2c30fc08132275b40f43b0b7f2a13b316c74a3ea18bb7a5db0

image=$($docker inspect -f '{{.Config.Image}}' "$container")
image_server_sha256=$($docker run --rm --network none --entrypoint sha256sum "$image" /app/src/server.ts | cut -d' ' -f1)
if [ "$image_server_sha256" != "$opencloud_server_sha256" ]; then
  echo "$image has another src/server.ts than the one cernbox-server.ts is based on" >&2
  exit 1
fi

$docker cp "$server" "$container:/app/src/server.ts"
$docker restart "$container" >/dev/null
echo "$container now runs cernbox-server.ts"
