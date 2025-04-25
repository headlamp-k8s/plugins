#!/bin/sh
# This builds both the OCI image and the plugin tarball
set -e
set -o xtrace

# Ensure we have the plugin and the version
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <plugin> <version>"
  exit 1
fi

PLUGIN=$1
VERSION=$2

# Build the OCI image
echo "Building OCI image for ${PLUGIN}..."
docker buildx build --build-arg PLUGIN=${PLUGIN} -t headlamp-plugin-${PLUGIN}:${VERSION} .

# Build the plugin tarball
echo "Building plugin tarball..."
cd ${PLUGIN}
npm install
npm run build
npx @kinvolk/headlamp-plugin package | tail -n2
cd ..

echo "Finished building OCI image and plugin tarball."