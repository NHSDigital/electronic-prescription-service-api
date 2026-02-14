ARG DEVCONTAINER_VERSION=latest

FROM ghcr.io/nhsdigital/eps-devcontainers/fhir_facade_api:${DEVCONTAINER_VERSION}
USER root
# specify DOCKER_GID to force container docker group id to match host
RUN if [ -n "${DOCKER_GID}" ]; then \
      if ! getent group docker; then \
        groupadd -g ${DOCKER_GID} docker; \
      else \
        groupmod -g ${DOCKER_GID} docker; \
      fi && \
      usermod -aG docker vscode; \
    fi

USER vscode
