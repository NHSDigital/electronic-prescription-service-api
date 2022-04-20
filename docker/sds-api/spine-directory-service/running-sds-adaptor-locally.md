# Running the SDS adaptors locally

It may be useful to run these adaptors in a local environment. The following is a step-by-step guide on how to set this up.

* Requirements:
    - OpenTest connection [Set up NHS Digital OpenTest connection](../setup-opentest.md)
    - Docker - for example [Docker for Windows](https://docs.docker.com/docker-for-windows/)
    <!-- not needed as we are using Dockerfile
    - [Packer](https://www.packer.io/) -->
    <!-- not needed as it's all running in containers
    - [Python 3](https://www.python.org/downloads/)
    - [Pipenv](https://pipenv.kennethreitz.org/en/latest/install/#pragmatic-installation-of-pipenv) -->
    - git bash (to run .sh files below)
* Set up Environment variable:
`export BUILD_TAG='latest'`
* Run the `./build.sh` script found in the top level directory of this project. This will build docker images which
are required to run the SDS Adaptor in using docker.

 * Set up Environment variables. The environment variables `SDS_SECRET_PARTY_KEY`, `SDS_SECRET_CLIENT_CERT`, `SDS_SECRET_CLIENT_KEY` and `SDS_SECRET_CA_CERTS` need to
  be set when running this command. These variables should be set as described [here](sds-adaptor-dev-notes.md#environment-variables).
  A simple way of setting this up once is to create a bash file `configure-env-vars.sh` that looks like:
    ```sh
    export SDS_SECRET_PARTY_KEY="your party key from NHS Digital here"
    export SDS_SECRET_CLIENT_CERT=$'client cert from NHS Digital here'
    export SDS_SECRET_CLIENT_KEY=$'client key from NHS Digital here'
    export SDS_SECRET_CA_CERTS=$'ca certs from NHS Digital here'
    ```
    and then run `source configure-env-vars.sh`

* Ensure your OpenTest connectivity is enabled in OpenVPN. (This does not apply if you have an available HSCN connection)

* Run `docker-compose up`. This will start the containers which have been built or pulled down, as described above.

* Note that the `SDS_LOG_LEVEL` environment variable (as documented [here](sds-adaptor-dev-notes.md#environment-variables)) is set by default to `NOTSET` in the
`docker-compose.yml` file but should be changed if needed.

## Smoke Testing your local SDS adaptor

The Spine Directory Service expose a health-check endpoint which can also be used to facilitate health checks in a load balanced environment.

It's exposed with `/healthcheck` URL path which, when called indicates healthy state by returning an empty HTTP 200 response.
Additionally there is a "deep" version of the healthcheck at `/healthcheck/deep` that also checks LDAP connectivity.
In order to determine the ports on `localhost` which these health-check endpoints are listening on, examine your local copy
of the [docker-compose](../docker-compose.yml) file.
