## "The Point"

...is to have a list of "features" that both:

1) describe what Pepr can do, and
2) act as smoke tests for their respective features.

### TODO
- Custom config
  - ✗ name	User-defined name of the module	pepr-test-module
    - can't test until I know where is this used...
    - looks like it ISN'T really used -- so, it should go away!
  - ✓ onError	Behavior of the webhook failure policy	reject, ignore
  - ✓ webhookTimeout	Webhook timeout in seconds	1 - 30
  - ✓ customLabels	Custom labels for namespaces	{namespace: {}}
  - ✓ env
  - _ alwaysIgnore	Conditions to always ignore	{namespaces: [], labels: []}

- ClusterRoleBindings
  - defaults
  - customized
    - watch w/ custom permission get the watched
    - (in journey test for example?)

- Namespace does not match
  - cape ns: [] && filter ns: []
  - cape ns: [*] && filter ns: []
  - cape ns: [] && filter ns: [*]
  - cape ns: [*] && filter ns: [*]

### store (global)
- clear
- setItem
- ✓ getItem
- ✓ setItemAndWait
- removeItem
- removeItemAndWait
- onReady
- subscribe (and unsubscribe!)
- find some way to demonstrate the time it takes to round-trip the store (cuz, surprisingly to some, it's long)

### schedule ###
- Should be able to schedule something!

### filters (global)
- InNamespace
- WithName
- WithLabel
- WithAnnotation

### module (global):
- Module Hooks..?
- in Pepr-controlled namespaces
  - works
- ...and otherwise
  - skipped
  - ...but (maybe) the "default" ns is an exception?

### admission
- configurable webhook timeouts

### validate
- create
- update
- createorupdate
- delete

### mutate
- create
- update
- createorupdate
- delete
  - might be difficult (?) but dig through mutate-processor to find a way to test
  - mutates DO happen

### watch
- figure out how / when the verb filters fire on watch (might be that .isCreated().Watch() might still have callback fired on deletes, etc.)
- create
- update
- createorupdate
- delete (or is this kinda not necessary..?)

### reconcile
- same as watch, ish.
- but with Queue
  - have the Module action have each callback delay a random amount of time
  - they should still resolve in the order sent to Pepr

### combination actions
- create+mutate+validate+watch+update+delete+etc.