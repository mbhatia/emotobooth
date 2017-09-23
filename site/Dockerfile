FROM node:8-wheezy

## Install all the dependencies
RUN apt-get update; \
	apt-get install -y --no-install-recommends \
                build-essential \
                git \
                tmux \
                toilet \
                vim-nox \
                htop \
                imagemagick \
                graphicsmagick \
                fontconfig \
                curl \
        ; \
	rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json /app/
RUN npm install

## install phantomjs for linux 64-bit
RUN mkdir /tmp/phantomjs && cd /tmp/phantomjs && \
    curl -L https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2 | tar xj && \
    mv `find . -name phantomjs -type f` /usr/bin/phantomjs && \
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
