Install Kube Prometheus

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 
k create ns monitoring
helm repo update
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack --debug --namespace monitoring
```

[Install Pepr]

Create ServiceMonitor

The default prometheus config has 

```yaml
    scrapeConfigSelector:
      matchLabels:
        release: kube-prometheus-stack
```

So make sure to include that label in the ServiceMonitor

```bash
kubectl apply -f -<<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: watcher
  annotations: {}
  labels:
    release: kube-prometheus-stack
  namespace: monitoring
spec:
  selector:
    matchLabels:
      pepr.dev/controller: watcher
  namespaceSelector:
    matchNames:
      - pepr-system
  endpoints:
    - targetPort: 3000
      scheme: https
      tlsConfig:
        insecureSkipVerify: true
EOF
```

