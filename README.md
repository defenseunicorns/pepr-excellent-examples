# Pepr Excellent Examples

This repository is a collection of examples exercising the capabilities of Pepr.

Here, you'll find practical implementations of Pepr Modules to cover various scenarios. Whether you're new to Pepr or an experienced user, these examples will help you understand how to build and deploy applications effectively.

## Exercising the Examples

Most examples are designed around a test suite that demonstrates / verifies how they work.

To run all example suites:

```sh
npm run test:e2e
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


## Digging In

### Viewing an Example Cluster (via K9s)

```sh
# KUBECONFIG=$(k3d kubeconfig write pexex-<npm module name>-e2e) k9s

KUBECONFIG=$(k3d kubeconfig write pexex-hello-pepr-watch-e2e) k9s
``` 
 Note: the tests will _automatically_ clean these clusters up when they complete, so be sure to Ctrl+C-out of a running suite if you wanna poke around!



### Testing with a development version of the Pepr controller

To run all example suites against a custom version of the Pepr controller, specify an image tag using the `--image` flag:

```sh
npm run test:e2e -- --image pepr:dev
```


### Testing with a development version of the Pepr lib

You can use the symbolic linking to swap-in a development version of the `pepr` package when building the excellent examples -- a particularly useful ability when co-developing new Pepr features + associated examples.

#### Setup

```sh
cd <pepr>
npm run build

cd <pepr-excellent-examples>
npm install
rm -rf node_modules/pepr
ln -s <pepr> node_modules/pepr
```

#### Cleanup

```sh
cd <pepr-excellent-examples>
rm -rf node_modules
npm install
```
