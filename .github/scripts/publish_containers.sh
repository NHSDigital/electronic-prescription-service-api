#!/usr/bin/env bash

image_name=$1
version_number=$2

printf "\n\n------------------------------------------------------------\n"
printf "Publishing container to ECR with the follow configuration:\n\n"

echo "Image name: $image_name"
echo "Version number: $version_number"

printf "\n\n------------------------------------------------------------\n\n"

# Get the login command from ECR and execute it directly
echo "Logging into ECR..."
eval "$PROXYGEN_PATH" docker get-login

# Get the proxygen docker registry
echo "Retrieving the proxygen docker registry..."
proxygen_docker_registry=$(proxygen docker registry)

# Tag the image with the remote URL
echo "Tagging the image with the remote URL..."
image_tag="$proxygen_docker_registry/$image_name:$version_number"
echo "Using image tag: $image_tag"
docker image tag "$image_name" "$image_tag"

# Push the image to the remote URL
echo "Pushing the image to the remote URL..."
docker push "$image_tag"

printf "\n\nDone publishing the container to ECR"
printf "------------------------------------------------------------\n\n"
