FROM node:24-alpine3.21

RUN apk update && apk upgrade
RUN apk add --update python3 make g++ # for Mac M1 processors
RUN apk add zip --no-cache bash bash-doc bash-completion libtool autoconf automake nasm pkgconfig libpng gcc make g++ zlib-dev gawk

ENV COREPACK_HOME=/tmp/corepack
RUN corepack enable
RUN corepack install --global yarn@4.13.0

RUN mkdir -p /app
WORKDIR /app
