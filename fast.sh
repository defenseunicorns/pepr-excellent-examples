#!/bin/bash

rm -rf node_modules
npm i
rm -rf node_modules/pepr
# cp -r ~/pepr node_modules/pepr
ln -s $HOME/pepr $(pwd)/node_modules/pepr

