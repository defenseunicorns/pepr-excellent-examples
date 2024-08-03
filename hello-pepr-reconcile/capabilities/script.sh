#!/bin/bash

kubectl run a -n pepr-demo --image=nginx --restart=Never -l color=red
kubectl run b -n pepr-demo --image=nginx --restart=Never -l color=red
sleep 1
kubectl label po a color=green -n pepr-demo --overwrite
kubectl label po b color=green -n pepr-demo --overwrite
sleep 1
kubectl label po a color=blue -n pepr-demo --overwrite
kubectl label po b color=blue -n pepr-demo --overwrite
sleep 1
kubectl label po a color=yellow -n pepr-demo --overwrite

