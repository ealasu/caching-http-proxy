#!/usr/bin/env bash
set -e

mkdir -p config

openssl req \
      -newkey rsa:2048 -nodes -keyout config/app.key \
      -x509 -days 9999 -out config/app.crt
