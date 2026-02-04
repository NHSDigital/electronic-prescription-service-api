# syntax=docker/dockerfile:1.4
FROM mcr.microsoft.com/devcontainers/base:ubuntu

ARG TARGETARCH
ENV TARGETARCH=${TARGETARCH}

ARG ASDF_VERSION
COPY .tool-versions.asdf /tmp/.tool-versions.asdf

# Add amd64 architecture if on arm64
RUN if [ "$TARGETARCH" == "arm64" ] || [ "$TARGETARCH" == "aarch64" ]; then dpkg --add-architecture amd64; fi

# this should be regularly updated to the latest version from https://github.com/NHSDigital/validation-service-fhir-r4/releases
ARG VALIDATOR_VERSION_TAG=v1.0.344-alpha

RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y dist-upgrade \
    && apt-get -y install --no-install-recommends htop vim curl git build-essential \
    libffi-dev libssl-dev libxml2-dev libxslt1-dev libjpeg8-dev libbz2-dev \
    zlib1g-dev unixodbc unixodbc-dev libsecret-1-0 libsecret-1-dev libsqlite3-dev \
    openjdk-8-jdk jq apt-transport-https ca-certificates gnupg-agent \
    software-properties-common bash-completion python3-pip make libbz2-dev \
    libreadline-dev libsqlite3-dev wget llvm libncurses5-dev libncursesw5-dev \
    xz-utils tk-dev liblzma-dev netcat-traditional default-jre maven libyaml-dev

# Download correct AWS CLI for arch
RUN if [ "$TARGETARCH" = "arm64" ] || [ "$TARGETARCH" == "aarch64" ]; then \
      wget -O /tmp/awscliv2.zip "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip"; \
    else \
      wget -O /tmp/awscliv2.zip "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip"; \
    fi && \
    unzip /tmp/awscliv2.zip -d /tmp/aws-cli && \
    /tmp/aws-cli/aws/install && \
    rm /tmp/awscliv2.zip && rm -rf /tmp/aws-cli

# Download correct SAM CLI for arch
RUN if [ "$TARGETARCH" = "arm64" ] || [ "$TARGETARCH" == "aarch64" ]; then \
      wget -O /tmp/aws-sam-cli.zip "https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-arm64.zip"; \
    else \
      wget -O /tmp/aws-sam-cli.zip "https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip"; \
    fi && \
    unzip /tmp/aws-sam-cli.zip -d /tmp/aws-sam-cli && \
    /tmp/aws-sam-cli/install && \
    rm /tmp/aws-sam-cli.zip && rm -rf /tmp/aws-sam-cli

# Install ASDF
RUN ASDF_VERSION=$(awk '!/^#/ && NF {print $1; exit}' /tmp/.tool-versions.asdf) && \
    wget -O /tmp/asdf.tar.gz https://github.com/asdf-vm/asdf/releases/download/v${ASDF_VERSION}/asdf-v${ASDF_VERSION}-linux-amd64.tar.gz; \
    tar -xvzf /tmp/asdf.tar.gz; \
    mv asdf /usr/bin


# install non snap version of firefox
RUN add-apt-repository -y ppa:mozillateam/ppa
COPY <<EOF /etc/apt/preferences.d/mozilla-firefox 
Package: *
Pin: release o=LP-PPA-mozillateam
Pin-Priority: 1001 
EOF

RUN apt-get -y install firefox
USER vscode


ENV PATH="$PATH:/home/vscode/.asdf/shims/"

# Install ASDF plugins
RUN asdf plugin add python; \
    asdf plugin add poetry https://github.com/asdf-community/asdf-poetry.git; \
    asdf plugin add shellcheck https://github.com/luizm/asdf-shellcheck.git; \
    asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git; \
    asdf plugin add java; \
    asdf plugin add actionlint; \
    asdf plugin add ruby https://github.com/asdf-vm/asdf-ruby.git

WORKDIR /workspaces/electronic-prescription-service-api
ADD .tool-versions /workspaces/electronic-prescription-service-api/.tool-versions

RUN asdf install python; \
    asdf install

RUN echo 'source /workspaces/electronic-prescription-service-api/.envrc' >> ~/.bashrc

# download validator
RUN git clone --depth 1 --branch $VALIDATOR_VERSION_TAG https://github.com/NHSDigital/validation-service-fhir-r4.git /workspaces/validator
ADD .tool-versions /workspaces/validator/.tool-versions
