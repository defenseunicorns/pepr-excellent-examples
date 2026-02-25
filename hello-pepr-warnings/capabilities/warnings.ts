import { a, Capability, Log } from "pepr";

const name = "hello-pepr-warnings";

export const HelloPeprWarnings = new Capability({
  name: name,
  description: "Testing warnings in validation responses",
  namespaces: [name],
});

const { When } = HelloPeprWarnings;

// Test ConfigMap with approval and warnings
When(a.ConfigMap)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("warnings-approve")
  .Validate(function warningsApprove(request) {
    const warnings = [];

    // Check for deprecated fields
    if (request.Raw.data && request.Raw.data["deprecated-field"]) {
      warnings.push(
        "Warning: The 'deprecated-field' is being used and will be removed in future versions",
      );
    }

    // Check for missing app label
    if (!request.HasLabel("app")) {
      warnings.push(
        "Warning: Best practice is to include an 'app' label for resource identification",
      );
    }

    // Check for large number of configuration items
    if (request.Raw.data && Object.keys(request.Raw.data).length > 5) {
      warnings.push(
        "Warning: Large number of configuration items detected. Consider splitting into multiple ConfigMaps",
      );
    }

    if (warnings.length > 0) {
      Log.info({ warnings }, "Approving request with warnings:");
    } else {
      Log.info("Approving request without warnings");
    }

    return request.Approve(warnings.length > 0 ? warnings : undefined);
  });

// Test ConfigMap with denial and warnings
When(a.ConfigMap)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("warnings-deny")
  .Validate(function warningsDeny(request) {
    // Check for dangerous settings
    if (request.Raw.data && request.Raw.data["dangerous-setting"] === "true") {
      const warnings = [
        "Warning: The 'dangerous-setting' field is set to 'true'",
        "Consider using a safer configuration option",
      ];

      Log.info({ warnings }, "Denying request with warnings");

      return request.Deny(
        "ConfigMap contains dangerous settings that are not allowed",
        422,
        warnings,
      );
    }

    Log.info("Approving request without warnings");
    return request.Approve();
  });

// Test ConfigMap with multiple warnings in approval
When(a.ConfigMap)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("warnings-multiple")
  .Validate(function warningsMultiple(request) {
    const warnings = [];

    // Add multiple warnings based on different conditions
    if (request.Raw.data && request.Raw.data["setting1"] === "deprecated") {
      warnings.push(
        "Warning: The value 'deprecated' for 'setting1' is deprecated",
      );
    }

    if (request.Raw.data && request.Raw.data["setting2"] === "insecure") {
      warnings.push(
        "Warning: The value 'insecure' for 'setting2' is not recommended for production",
      );
    }

    if (!request.HasLabel("environment")) {
      warnings.push("Warning: Missing 'environment' label");
    }

    if (!request.HasLabel("app")) {
      warnings.push("Warning: Missing 'app' label");
    }

    if (warnings.length > 0) {
      Log.info({ warnings }, "Approving request with multiple warnings");
    } else {
      Log.info("Approving request without warnings");
    }

    return request.Approve(warnings.length > 0 ? warnings : undefined);
  });
