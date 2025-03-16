#!/bin/bash
VERSION=${1:-v2}
docker build  .  -t aolifu/awalong:$VERSION
docker push aolifu/awalong:$VERSION
docker stop awalong
docker rm awalong
docker run -d --name awalong -p 11012:5001 aolifu/awalong:$VERSION