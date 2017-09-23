FROM node:8-alpine

## Install all the dependencies
RUN apk add --no-cache \
        build-base \
        g++ \
        git \
        tmux \
        vim \
        htop \
        imagemagick \
        graphicsmagick \
        cairo-dev \
        libjpeg-turbo-dev \
        jpeg-dev \
        pango-dev \
        giflib-dev \
        pkgconf \
        bash

        ##toilet \

WORKDIR /app

COPY package.json /app/
RUN npm install
    #npm uninstall phantomjs-prebuilt
    #npm install phantomjs-prebuilt --no-bin-links

## install phantomjs specific to Alpine
RUN apk update && apk add --no-cache fontconfig curl && \
    mkdir -p /usr/share && \
    cd /usr/share && \
    curl -L https://github.com/Overbryd/docker-phantomjs-alpine/releases/download/2.11/phantomjs-alpine-x86_64.tar.bz2 | tar xj && \
    ln -s /usr/share/phantomjs/phantomjs /usr/bin/phantomjs && \
    phantomjs --version

RUN mkdir -p \
    data/in/ \
    data/out/ \
    data/out-print/ \
    data/out-photostrips/

EXPOSE 8080
EXPOSE 9229

COPY . /app/

CMD [ "node", "--inspect=0.0.0.0", "server.js" ]
