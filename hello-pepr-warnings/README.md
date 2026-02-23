# Action: Validation Warnings

This module demonstrates how to use the warnings feature in Pepr validation responses.

## Overview

The warnings feature allows Pepr modules to include warning messages in both approval and denial responses during validation. 
This provides a way to communicate important information to users without necessarily blocking their requests.

## Scenarios

This module includes three key scenarios that demonstrate different ways to use warnings:

1. **Approval with Warnings** (`warnings-approve`)
   - Approves a ConfigMap while including warnings about:
     - Use of deprecated fields
     - Missing recommended labels
     - Too many configuration items in a single ConfigMap

2. **Denial with Warnings** (`warnings-deny`)
   - Denies a ConfigMap that contains dangerous settings
   - Includes warnings that explain why the settings are dangerous
   - Uses a custom status code (422) for the denial

3. **Multiple Warnings** (`warnings-multiple`)
   - Demonstrates how to aggregate multiple warnings in a single approval
   - Shows warnings for deprecated and insecure settings
   - Shows warnings for missing recommended labels

## Implementation Details

The module demonstrates three key validation patterns:

1. Using `request.Approve(warnings)` to approve a request with warnings
2. Using `request.Deny(message, statusCode, warnings)` to deny a request with warnings
3. Collecting and aggregating multiple warnings in a single response

These patterns can be used to provide helpful feedback to users while still enforcing policies. 
The warnings appear in both the API response and in the Pepr logs.

## Testing

The module includes end-to-end tests that verify:
- Resources with warnings are properly approved when appropriate
- Resources with dangerous settings are denied with appropriate warnings
- Multiple warnings are correctly aggregated and returned in responses

>[!TIP] Learn more about [Validation Warnings](https://docs.pepr.dev/actions/validate/#validation-with-warnings)