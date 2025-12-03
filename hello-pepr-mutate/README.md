# Mutate() Module

This module demonstrates how to use the Pepr **Mutate** action to modify Kubernetes objects during admission. Mutations allow you to enforce defaults, apply standard labels/annotations, or clean up unwanted metadata before the resource is persisted.

For full documentation, visit:  
👉 **https://docs.pepr.dev/actions/mutate**

---

## When should you use Mutate?

Use **Mutate** when you need to:

- Apply default labels or annotations to resources as they are created.
- Remove unwanted metadata automatically (labels, annotations, fields).
- Normalize metadata so all resources follow your conventions.
- Enforce consistent cluster hygiene by modifying objects before they are stored.
- Transform user-provided metadata without rejecting the request.

---

## When *not* to use Mutate

Avoid **Mutate** when:

- You only want to *validate* correctness — use **Validate()** instead.
- You need long-running or post-persistence reactions — use **Watch()** or **Reconcile()**.
- You want to block the object unless changes are made — use **Validate()** with a failure response.

---

## Example: Add a label on creation

```ts
When(a.ConfigMap)
  .IsCreated()
  .Mutate(req => {
    req.SetLabel("pepr", "was-here");
  });
