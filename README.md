# Pepr Excellent Examples

This repository is a collection of examples exercising the capabilities of Pepr.

Here, you'll find practical implementations that demonstrate the use of Pepr in various scenarios. Whether you're new to Pepr or an experienced user, these examples will help you understand how to build and deploy applications effectively.

## Exercising the Examples

Most examples are designed around a test suite that demonstrates / verifies how they work.

To run all example suites in a single command:

```sh
npm run test:e2e
```

To run only a single example suite instead, specify which using `-w` flag:

```sh
# npm run test:e2e -w <npm module name>

npm run test:e2e -w hello-pepr-store -- -i pepr:dev
```

To get even more targeted, you can select spec tests to run using some `-- --passthru` magic:

```sh
# npm run test:e2e -w <npm module name> -- --passthru="<jest flags>"

npm run test:e2e -w hello-pepr-validate -- --passthru="--testNamePattern='validate creates'"
```
