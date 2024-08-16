# Soak Test CI

This test is to run a soak test on the pepr candidate.
The soak test will run for 2 hours and 15 minutes and will fail prior if the test fails. A test failes if a "stuck" pod lives beyond the relist window. Metrics are collected from the action every 5 minutes.

```bash
npm run test:e2e -w hello-pepr-soak-ci -- -i pepr:dev
```

Generate Istio Manifests

```bash
istioctl manifest generate --set profile=demo > istio-demo.yaml
```
