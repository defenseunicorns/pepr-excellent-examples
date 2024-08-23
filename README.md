# Pepr Excellent Examples

This repository is a collection of examples exercising the capabilities of Pepr.

Here, you'll find practical implementations that demonstrate the use of Pepr in various scenarios. Whether you're new to Pepr or an experienced user, these examples will help you understand how to build and deploy applications effectively.

## Exercising the Examples

Most examples are designed around a test suite that demonstrates / verifies how they work.

To run all example suites:

```sh
npm run test:e2e
```

To run all example suites against a custom version of Pepr, specify which using the `--image` flag:

```sh
npm run test:e2e -- --image pepr:dev
```

To run a single example suite, specify which to run using `-w` flag:

```sh
# npm run test:e2e -w <npm module name>

npm run test:e2e -w hello-pepr-validate
```

To run a subset of tests, give Jest the specifics via the `--passthru` flag:

```sh
# npm run test:e2e -w <npm module name> -- --passthru="<jest flags>"

npm run test:e2e -w hello-pepr-validate -- --passthru="--testNamePattern='validate creates'"
```

## Troubleshooting

### Viewing the Example Cluster (via K9s)

```sh
# KUBECONFIG=$(k3d kubeconfig write pexex-<npm module name>-e2e) k9s

KUBECONFIG=$(k3d kubeconfig write pexex-hello-pepr-reconcile-e2e) k9s
``` 
