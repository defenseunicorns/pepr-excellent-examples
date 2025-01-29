import {
  GenericClass,
  K8s,
  kind,
  KubernetesListObject,
  KubernetesObject,
  RegisterKind
} from "kubernetes-fluent-client";
import { TestRunCfg } from './TestRunCfg';
import { untilTrue } from './general';
import { gone } from './resource';
import { sleep } from './time';
import { Cmd } from './Cmd';


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

  async function retryList(cls: GenericClass, retries: number = 3): Promise<void> {
    try {
      await K8s(cls).Get();
      return;
    }
    catch (err) {
      let status = err.hasOwnProperty("status") ? err.status : undefined;

      if (status === 429) {
        let delay = err.data.details.retryAfterSeconds;
        await sleep(delay);

        retries -= 1;
        if (retries > 0) {
          console.log(`Retrying (retries left: ${retries}).`);
          return await retryList(cls, retries);
        }
        else {
          console.error("retries exhausted!");
          throw err;
        }
      }
      else if ([404, 405].includes(status)) {
        // if there are no resources to return (404), or
        // if there are no resources allowed (405)
        return;
      }
      else {
        throw err;
      }
    }
  }
  let kinds = Object.keys(kind).filter(k => k !== "GenericKind").map(k => kind[k]);
  await Promise.all(kinds.map(k => retryList(k)));

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

    const react404 = async (err: KfcErr): Promise<KfcErr|void> => {
      err = err;  // noop
      return;
    }

    const react405 = async (err: KfcErr): Promise<KfcErr|void> => {
      err = err; // noop
      return;
    }

    const react429 = async (err: KfcErr) => {
      // let delay = err.data ? err.data.details.retryAfterSeconds : 1;
      if (!err.data){ console.error(err) }
      let delay = err.data.details.retryAfterSeconds;
      await sleep(delay);
    }

    type KfcErr = {
      status?: number
      data?: {
        details?: any
      }
    }
    type AsyncFunc = (...args: any[]) => any;

    async function retryable<T>(action: AsyncFunc, reactions: Record<string, AsyncFunc>, retries: number = 3): Promise<T> {
      try { return await action(); }
      catch (err) {
        let status = err.hasOwnProperty("status") ? `${err.status}` : undefined;

        if (status === '429') {
          await reactions['429'](err);

          retries -= 1;
          if (retries > 0) {
            return await retryable(action, reactions, retries);
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

    const act = (cls: GenericClass): () => Promise<[GenericClass, KubernetesListObject<any>]> => {
      return async () => {
        const got = await K8s(cls).Get();
        return [cls, got];
      }
    }

    const gets = await Promise.all(kinds.map(k => retryable(
      act(k),
      {
        '404': react404,
        '405': react405,
        '429': react429,
      }
    )));

    // // call cluster for all available (non-404) & authorized (non-405) resources
    // async function retryList(cls: GenericClass, retries: number = 3): Promise<[GenericClass, KubernetesListObject<any>]> {
    //   try {
    //     const got = await K8s(cls).Get();
    //     return [cls, got];
    //   }
    //   catch (err) {
    //     let status = err.hasOwnProperty("status") ? err.status : undefined;

    //     if (status === 429) {
    //       let delay = err.data.details.retryAfterSeconds;
    //       await sleep(delay);

    //       retries -= 1;
    //       if (retries > 0) {
    //         console.error("retries exhausted!");
    //         return await retryList(cls, retries);
    //       }
    //       else {
    //         throw err;
    //       }
    //     }
    //     else if ([404, 405].includes(status)) {
    //       // if there are no resources to return (404), or
    //       // if there are no resources allowed (405)
    //       return;
    //     }
    //     else {
    //       throw err;
    //     }
    //   }
    // }
    // const gets = await Promise.all(kinds.map(k => retryList(k)));

    // unwrap resource lists
    // const resources = gets.flatMap(g => g ? [g] : [])
    //   .flatMap(([k, l]) => 
    //     l.items.map(o => [k, o] as [GenericClass, KubernetesObject])
    //   )

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

    async function retryDelete(cls: GenericClass, obj: KubernetesObject, retries: number = 3): Promise<void> {
      try {
        return await K8s(cls).Delete(obj);
      }
      catch (err) {
        let status = err.hasOwnProperty("status") ? err.status : undefined;

        if (status === 429) {
          let delay = err.data.details.retryAfterSeconds;
          await sleep(delay);

          retries -= 1;
          if (retries > 0) {
            return await retryDelete(cls, obj, retries);
          }
          else {
            console.error("retries exhausted!");
            throw err;
          }
        }

        else {
          throw err;
        }
      }
    }

    // delete test-labelled resources (in parallel)
    tbds.forEach(async ([k, o]) => await retryDelete(k, o))
    let terminating = tbds.map(tbd => untilTrue(() => gone(...tbd)))
    await Promise.all(terminating)
  }
  finally {
    process.env = { ...originalEnv }
  }
  console.timeEnd(msg)
}
