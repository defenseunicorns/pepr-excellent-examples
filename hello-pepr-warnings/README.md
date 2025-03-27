# Hello Pepr Warnings

This module demonstrates and tests the warnings feature in Pepr validation responses.

## Overview

The warnings feature allows Pepr modules to include warning messages in both approval and denial responses during validation. This provides a way to communicate important information to users without necessarily blocking their requests.

## Test Scenarios

1. **Approval with Warnings**: Tests that a ConfigMap can be approved while still including warning messages about potential issues.
2. **Denial with Warnings**: Tests that a ConfigMap can be denied with warning messages providing additional context.
3. **Multiple Warnings**: Tests that multiple warnings can be included in a single response.

## Running the Tests

To run the tests:

```bash
cd hello-pepr-warnings
npm install
npm test
```

## Implementation Details

The module demonstrates three key validation patterns:

1. Using `request.Approve(warnings)` to approve a request with warnings
2. Using `request.Deny(message, statusCode, warnings)` to deny a request with warnings
3. Aggregating multiple warnings in a single response

These patterns can be used to provide helpful feedback to users while still enforcing policies.
