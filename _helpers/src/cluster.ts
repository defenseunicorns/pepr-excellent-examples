import {
  GenericClass,
  K8s,
  kind,
  KubernetesObject,
  RegisterKind
} from "kubernetes-fluent-client";
import { TestRunCfg } from './TestRunCfg';
import { untilTrue } from './general';
import { gone } from './resource';
import { sleep } from './time';
import { Cmd } from './Cmd';

type KfcErr = {
  status: number
  data: {
    details?: any
  }
}

type AsyncFunc<T> = (...args: any[]) => T;

const noop: AsyncFunc<void> = () => {};

async function retry<T, U>(action: AsyncFunc<T>, reactions: Record<string, AsyncFunc<U>>, retries: number = 3): Promise<T> {
  try {
    return await action();
  }
  catch (err) {
    let status = err.hasOwnProperty("status") ? `${err.status}` : undefined;

    if (['400', '429'].includes(status)) {
      await reactions[status](err);

      retries -= 1;
      if (retries > 0) {
        return await retry(action, reactions, retries);
      }
      else {
        console.error("retries exhausted!");
        throw err;
      }
    }
    else if (Object.keys(reactions).includes(status)) {
      const res = await reactions[status](err);
      if (res === undefined) { return; }
      throw res;
    }
    else {
      throw err;
    }
  }
}

export async function up(name: string = 'pexex-helpers-cluster'): Promise<string> {
  const create = await new Cmd({
    cmd: `k3d cluster create ${name} --kubeconfig-update-default=false`
  }).run()
  if (create.exitcode > 0) { throw create }

  if (process.env.PEPR_IMAGE) {
    const inject = await new Cmd({
      cmd: `k3d image import ${process.env.PEPR_IMAGE} -c ${name}`,
    }).run()
    if (inject.exitcode > 0) { throw inject }
  }

  // delay return until installed kinds are servable from cluster (i.e. no 429s)
  let kinds = Object.keys(kind).filter(k => k !== "GenericKind").map(k => kind[k]);
  await Promise.all(kinds.map(async (k) => await retry(
    async () => await K8s(k).Get(),
    {
      '400': async () => {
        await sleep(5);
      },
      '404': noop,
      '405': noop,
      '429': async (err: KfcErr) => {
        await sleep(err.data.details ? err.data.details.retryAfterSeconds : 1);
      },
    }
  )));

  const config = await new Cmd({
    cmd: `k3d kubeconfig write ${name}`
  }).run()
  if (config.exitcode > 0) { throw config }

  return config.stdout[0]
}

export async function down(name: string = 'pexex-helpers-cluster'): Promise<void> {
  const remove = await new Cmd({ cmd: `k3d cluster delete ${name}` }).run()
  if (remove.exitcode > 0) { throw remove }
}

export async function clean(trc: TestRunCfg): Promise<void> {
  const originalEnv = { ...process.env }

  let msg = "clean test-owned resources"
  console.time(msg)
  try {
    // config KFC to use test-specific kube config
    process.env.KUBECONFIG = trc.kubeConfig

    // K8s-native kinds
    let kinds = Object.keys(kind)
      .filter(k => k !== "GenericKind")
      .map(k => kind[k])

    // in-cluster crd-based generic kinds
    const crds = await K8s(kind.CustomResourceDefinition).Get()
    crds.items.forEach(crd => {
      const grp = crd.spec.group
      const knd = crd.spec.names.kind

      crd.spec.versions.forEach(version => {
        const ver = version.name
        const name = `${ver.slice(0, 1).toUpperCase()}${ver.slice(1)}${knd}`
        const cls = { [name]: class extends kind.GenericKind {} }

        // the KFC has a module-level list of registered kinds but doesn't expose
        //  it, so can't validate registereds... have to catch/squash re-registers
        try {
          RegisterKind(cls[name], { group: grp, version: ver, kind: knd })

        } catch (e) {
          const expected = e.message === `GVK ${name} already registered`
          if (!expected) { throw e }
        }

        kinds.push(cls[name])
      })
    })

    const gets = await Promise.all(
      kinds.map(k => retry(
        async () => [ k, await K8s(k).Get() ],
        {
          '404': noop,
          '405': noop,
          '429': async (err: KfcErr) => {
            await sleep(err.data.details ? err.data.details.retryAfterSeconds : 1);
          },
        }
      ))
    );

    // unwrap resource lists
    const resources = gets
    .flatMap(g => g ? [g] : [])
    .flatMap(([k, l]) => {
      const res = l.items.map(o => [k, o])
      return (res as [GenericClass, KubernetesObject][]);
    })

    // isolate test-labelled resources
    const [prefix, ] = trc.labelKey().split("/")
    const tbds = resources.filter(([, o]) =>
      o.metadata.labels &&
        Object.keys(o.metadata.labels)
          .filter(l => l.startsWith(`${prefix}/`))
          .length > 0
    )

    // delete test-labelled resources (in parallel)
    tbds.forEach(async ([k, o]) => await retry(
      async () => await K8s(k).Delete(o),
      {
        '429': async (err: KfcErr) => {
          await sleep(err.data.details ? err.data.details.retryAfterSeconds : 1);
        }
      }
    ));
    let terminating = tbds.map(tbd => untilTrue(() => gone(...tbd)))
    await Promise.all(terminating)
  }
  finally {
    process.env = { ...originalEnv }
  }
  console.timeEnd(msg)
}
