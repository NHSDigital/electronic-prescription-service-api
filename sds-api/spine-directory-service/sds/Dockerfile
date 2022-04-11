FROM python:3.7-slim as base

RUN apt-get update && \
    apt-get install build-essential -y

RUN mkdir -p /usr/src/app

COPY ./Pipfile /usr/src/app
COPY ./Pipfile.lock /usr/src/app

RUN pip install pipenv

COPY *sds-api/spine-directory-service/sds/ /usr/src/app/spine-directory-service/sds

WORKDIR /usr/src/app

RUN pipenv install --deploy --ignore-pipfile

EXPOSE 9000

ENTRYPOINT pipenv run start
