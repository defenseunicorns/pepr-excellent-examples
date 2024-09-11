## Digging In

### Viewing an Example Cluster (via K9s)

```sh
# KUBECONFIG=$(k3d kubeconfig write pexex-<npm module name>-e2e) k9s

KUBECONFIG=$(k3d kubeconfig write pexex-hello-pepr-reconcile-e2e) k9s
``` 


### Testing with a development version of the Pepr controller

To run all example suites against a custom version of Pepr, specify an image tag using the `--image` flag:

```sh
npm run test:e2e -- --image pepr:dev
```


### Building with a development version of Pepr lib

You can use the symbolic linking to swap-in a development version of `pepr` for building the excellent examples against -- a particularly useful function when co-developing new Pepr features + associated examples.

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