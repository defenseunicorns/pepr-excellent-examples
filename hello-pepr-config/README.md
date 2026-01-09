# Config

Pepr modules can be customized through configuration options in `package.json` under the `pepr` section. These module-level settings apply globally across all capabilities, allowing you to customize labels, environment variables, namespace exclusions, and webhook behavior.

## Use module configuration for:
- Setting global behavior that applies to all capabilities in your module
- Adding custom labels for organizational or monitoring purposes
- Injecting environment variables needed across multiple capabilities
- Excluding system namespaces from processing
- Adjusting webhook timeouts for cluster-specific performance needs

## Code Examples

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-config)

**Module Configuration in package.json:**
```json
{
  "pepr": {
    "uuid": "aac63ece-b202-5b18-b3c8-fff5b631a4f1",
    "onError": "reject",
    "webhookTimeout": 15,
    "customLabels": {
      "namespace": {
        "super": "secret",
        "special": "sauce"
      }
    },
    "alwaysIgnore": {
      "namespaces": [
        "hello-pepr-config-ignore"
      ]
    },
    "env": {
      "ITS": "a bird, a plane, superman"
    }
  }
}
```

**Accessing Environment Variables in Code:**
```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .WithName("noop")
  .Mutate(async function mutateEnv() {
    Log.info({ ITS: process.env.ITS }, "env");
  });
```

#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","ITS":"a bird, a plane, superman","msg":"env"}
```

>[!TIP] Learn more about [Configuration](https://docs.pepr.dev/user-guide/customization/#packagejson-configurations-table)
