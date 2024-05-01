#!/usr/bin/env bash

image_name=$1
version_number=$2

# Get the login command from ECR and execute it directly
eval "$PROXYGEN_PATH" docker get-login

# Get the proxygen docker registry
proxygen_docker_registry=$(proxygen docker registry)

# Tag the image with the remote URL
image_tag="$proxygen_docker_registry/$image_name:$version_number"
docker image tag "$image_name" "$image_tag"

# Push the image to the remote URL
docker push "$image_tag"
