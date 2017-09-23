This readme is a quickstart using Docker.
Please refer to the main [README](README.md) for the various moving components of the project.

## Pre-requisites
* Docker
* `docker-compose`

## Update Config

* Copy `site/config.js.example` to `site/config.js` and set the directory as follows:

```
config.inDir = 'data/in/';
config.outDir = 'data/out/';
config.printDir = 'data/out-print/';
config.photostripDir = 'data/out-photostrips/';
```

Also, add your API key.

## Build

```bash
$ cd site
$ docker build -t emotobooth:4 .
```

## Run

```bash
$ cd site
$ docker-compose up -d
```

## Testing

* Verify `docker-compose ps` shows 2 containers running like below:

```
$ docker-compose ps
    Name                  Command               State                       Ports
------------------------------------------------------------------------------------------------------
site_node_1    node --inspect=0.0.0.0 ser ...   Up      0.0.0.0:8080->8080/tcp, 0.0.0.0:9229->9229/tcp
site_redis_1   docker-entrypoint.sh redis ...   Up      6379/tcp
```

* Monitor the logs:

```bash
$ docker-compose logs --tail 10 --follow -t node
```

* Drop new images in the `site/data/in` directory on your computer.
  You will not see the output folders directly, as they are only stored inside the docker container.

## UI Links

**NOTE**: The UI is very scaled up, so zoom to around `33%` to see the full UI.

* Windows
    * [panel](http://192.168.99.100:8080)
    * [grid](http://192.168.99.100:8080/?showgrid&prepopulate)
    * [buttons](http://192.168.99.100:8080/buttons)

* Mac OS
    * [panel](http://localhost:8080)
    * [grid](http://localhost:8080/?showgrid&prepopulate)
    * [buttons](http://localhost:8080/buttons)