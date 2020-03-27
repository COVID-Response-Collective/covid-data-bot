#!/bin/bash

docker image build -t covid-data-bot:0.2 .
docker container run --publish 8000:8080 --detach --name cbot covid-data-bot:0.2 
