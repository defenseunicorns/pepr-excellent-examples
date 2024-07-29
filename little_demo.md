```
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token) 
curl -k -H "Authorization: Bearer $TOKEN" https://kubernetes/api/v1/namespaces/default/pods?watch=1&resourceVersion=695
```
