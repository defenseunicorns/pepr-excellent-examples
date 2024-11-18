# Load Test Module

This module isn't intended as a Module Author example: it has been designed to act as a load generator for use in [Pepr Load Testing](https://github.com/defenseunicorns/pepr/blob/1350_load_test/hack/load.cli.ts).


## Usage

1. Assuming this workstation project folder layout:
    ```bash
    ├── pepr
    │   ├── hack
    │   │   ├── load.cli.ts
    │   ├── [...]
    ├── pepr-excellent-examples
    │   ├── hello-pepr-load
    │   ├── [...]
    ```

1. Move into Pepr project directory:
    ```bash
    cd <pepr project dir>
    ```

1. Prepare Pepr artifacts for test:

    ```bash
    npx ts-node hack/load.cli.ts prep ./
    ```

1. Bring up test cluster:

    ```bash
    npx ts-node hack/load.cli.ts cluster up
    ```

1. Deploy Pepr artifacts to test cluster:

    ```bash
    npx ts-node hack/load.cli.ts deploy ./pepr-0.0.0-development.tgz ./pepr-dev.tar ../pepr-excellent-examples/hello-pepr-load
    ```

1. Run load test against test cluster (using `configmap.yaml` load):

    ```bash
    npx ts-node hack/load.cli.ts run ../pepr-excellent-examples/hello-pepr-load capabilities/configmap.yaml
    ```

1. Post-process load test data and generate summary:

    ```bash
    npx ts-node hack/load.cli.ts post
    ```

1. Create a graph of post-processed load test data:

    ```bash
    npx ts-node hack/load.cli.ts graph
    ```

1. Bring down test cluster:

    ```bash
    npx ts-node hack/load.cli.ts cluster down
    ```
