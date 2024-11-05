import {
  GenericClass,
  K8s,
  kind,
  KubernetesListObject,
  KubernetesObject,
  RegisterKind,
} from "kubernetes-fluent-client";
import { TestRunCfg } from "./TestRunCfg";
import { untilTrue } from "./general";
import { gone } from "./resource";
import { Cmd } from "./Cmd";

export async function up(name: string = "pexex-helpers-cluster"): Promise<string> {
  const create = await new Cmd({
    cmd: `k3d cluster create ${name} --kubeconfig-update-default=false`,
  }).run();
  if (create.exitcode > 0) {
    throw create;
  }

  if (process.env.PEPR_IMAGE) {
    const inject = await new Cmd({
      cmd: `k3d image import ${process.env.PEPR_IMAGE} -c ${name}`,
    }).run();
    if (inject.exitcode > 0) {
      throw inject;
    }
  }

  const config = await new Cmd({
    cmd: `k3d kubeconfig write ${name}`,
  }).run();
  if (config.exitcode > 0) {
    throw config;
  }

  return config.stdout[0];
}

export async function down(name: string = "pexex-helpers-cluster"): Promise<void> {
  const remove = await new Cmd({ cmd: `k3d cluster delete ${name}` }).run();
  if (remove.exitcode > 0) {
    throw remove;
  }
}

export async function clean(trc: TestRunCfg): Promise<void> {
  const originalEnv = { ...process.env };

  const msg = "clean test-owned resources";
  console.time(msg);
  try {
    // config KFC to use test-specific kube config
    process.env.KUBECONFIG = trc.kubeConfig;

    // K8s-native kinds
    const kinds = Object.keys(kind)
      .filter(k => k !== "GenericKind")
      .map(k => kind[k]);

    // in-cluster crd-based generic kinds
    const crds = await K8s(kind.CustomResourceDefinition).Get();
    crds.items.forEach(crd => {
      const grp = crd.spec.group;
      const knd = crd.spec.names.kind;

      crd.spec.versions.forEach(version => {
        const ver = version.name;
        const name = `${ver.slice(0, 1).toUpperCase()}${ver.slice(1)}${knd}`;
        const cls = { [name]: class extends kind.GenericKind {} };

        // the KFC has a module-level list of registered kinds but doesn't expose
        //  it, so can't validate registereds... have to catch/squash re-registers
        try {
          RegisterKind(cls[name], { group: grp, version: ver, kind: knd });
        } catch (e) {
          const expected = e.message === `GVK ${name} already registered`;
          if (!expected) {
            throw e;
          }
        }

        kinds.push(cls[name]);
      });
    });

    // call cluster for all available (non-404) & authorized (non-405) resources
    const gets = await Promise.all(
      kinds.map(k =>
        K8s(k)
          .Get()
          .then(o => [k, o] as [GenericClass, KubernetesListObject<typeof k>])
          .catch(e => {
            if (![404, 405].includes(e.status)) {
              throw e;
            }
          }),
      ),
    );

    // unwrap resource lists
    const resources = gets
      .flatMap(g => (g ? [g] : []))
      .flatMap(([k, l]) => l.items.map(o => [k, o] as [GenericClass, KubernetesObject]));

    // isolate test-labelled resources
    const [prefix] = trc.labelKey().split("/");
    const tbds = resources.filter(
      ([, o]) =>
        o.metadata.labels &&
        Object.keys(o.metadata.labels).filter(l => l.startsWith(`${prefix}/`)).length > 0,
    );

    // delete test-labelled resources (in parallel)
    tbds.forEach(([k, o]) => K8s(k).Delete(o));
    const terminating = tbds.map(tbd => untilTrue(() => gone(...tbd)));
    await Promise.all(terminating);
  } finally {
    process.env = { ...originalEnv };
  }
  console.timeEnd(msg);
}
