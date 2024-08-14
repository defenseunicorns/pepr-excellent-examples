# Soak Test CI           

- [Background](#background)
- [Cluster Setup](#cluster-setup)
  - [k3d](#k3d)
  - [Kind](#kind)
- [Get Started](#get-started)
  - [install istio](#install-istio)
  - [install kubeshark](#install-kubeshark)


## Background

```bash
istioctl manifest generate --set profile=demo > k8s/istio.yaml
```

## Get Started 

#### Install Istio
Download [istioctl](https://istio.io/latest/docs/setup/getting-started/#download)

```bash
curl -L https://istio.io/downloadIstio | sh -
sudo mv istio-*/bin/istioctl /usr/local/bin/
```


```bash
istioctl install --set profile=demo -y
```

Deploy the module and watch logs in one terminal

```yaml
istioctl install --set profile=demo -y
kubectl apply -f dist
kubectl apply -f -<<EOF
apiVersion: v1
kind: Namespace
metadata:
  creationTimestamp: null
  name: pepr-demo
  labels:
    istio-injection: enabled
spec: {}
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen0
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            "zarf.dev/agent": "ignore"
            bug: "reproduce"
            api: "call"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen1
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            bug: "reproduce"
            api: "call"
            "zarf.dev/agent": "ignore"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
EOF
k label ns pepr-system istio-injection=enabled
k delete po -n pepr-system --all --force
k run curler -n pepr-system --image=nginx
sleep 10;
k exec -it curler -n pepr-system -- curl -k https://pepr-6233c672-7fca-5603-8e90-771828dd30fa-watcher/metrics
```

Logs

```bash
kubectl logs -n pepr-system -l pepr.dev/controller=watcher -f | jq 'select(.url != "/healthz")'
``` 


Create 10 `CronJob`(s) that produces 10 pods with sidecars every 60 seconds

```yaml
kubectl apply -f -<<EOF
apiVersion: v1
kind: Namespace
metadata:
  creationTimestamp: null
  name: pepr-demo
  labels:
    istio-injection: enabled
spec: {}
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen0
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            "zarf.dev/agent": "ignore"
            bug: "reproduce"
            api: "call"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen1
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            bug: "reproduce"
            api: "call"
            "zarf.dev/agent": "ignore"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen2
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            "zarf.dev/agent": "ignore"
            bug: "reproduce"
            api: "call"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen3
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            "zarf.dev/agent": "ignore"
            bug: "reproduce"
            api: "call"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen4
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            "zarf.dev/agent": "ignore"
            bug: "reproduce"
            api: "call"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen5
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            bug: "reproduce"
            api: "call"
            "zarf.dev/agent": "ignore"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen6
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            bug: "reproduce"
            api: "call"
            "zarf.dev/agent": "ignore"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen7
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            bug: "reproduce"
            api: "call"
            "zarf.dev/agent": "ignore"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen8
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            bug: "reproduce"
            api: "call"
            "zarf.dev/agent": "ignore"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  creationTimestamp: null
  name: podgen9
  namespace: pepr-demo
spec:
  jobTemplate:
    metadata:
      creationTimestamp: null
      name: podgen
    spec:
      ttlSecondsAfterFinished: 5
      template:
        metadata:
          creationTimestamp: null
          labels:
            bug: "reproduce"
            api: "call"
            "zarf.dev/agent": "ignore"
        spec:
          containers:
          - image: ubuntu
            command: ["sh","-c","sleep 10"]
            name: sleepanddie
            resources: {}
          restartPolicy: Never
  schedule: 0/1 * * * *
status: {}
EOF
```


Watch for secrets and pods, because if any stick around then you have reproduced the issue:

```bash
while true; do
  kubectl get secret,po -n pepr-demo --no-headers
  sleep 5
  clear
done
```

Watch the Watch Controller pods:

```bash
kubectl logs -n pepr-system -l pepr.dev/controller=watcher -f | jq 'select(.url != "/healthz")'
```

Watch the audit logs

```bash
while true; do
  docker exec kind-control-plane cat /var/log/kubernetes/kube-apiserver-audit.log | tail | jq
  sleep 5
done
```

#### Install Kubeshark

```bash
helm repo add kubeshark https://helm.kubeshark.co
helm install kubeshark kubeshark/kubeshark
```

Port-forward to the UI

```bash
kubectl port-forward service/kubeshark-front 8899:80
```
