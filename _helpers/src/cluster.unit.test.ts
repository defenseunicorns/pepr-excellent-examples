import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { up } from "./cluster.js";

const { command, get, sleep } = vi.hoisted(() => ({
  command: vi.fn(),
  get: vi.fn(),
  sleep: vi.fn(),
}));

vi.mock("./Cmd.js", () => ({
  Cmd: class {
    constructor(private spec: { cmd: string; env?: object }) {}
    run() {
      return command(this.spec);
    }
  },
}));
vi.mock("./time.js", () => ({ sleep }));
vi.mock("kubernetes-fluent-client", () => ({
  K8s: () => ({ Get: get }),
  kind: { ConfigMap: class {} },
  RegisterKind: vi.fn(),
}));

const success = { exitcode: 0, stdout: [], stderr: [] };
const unavailable = { exitcode: 1, stdout: [], stderr: ["apiserver not ready"] };
let originalKubeconfig: string | undefined;
let originalImage: string | undefined;

beforeEach(() => {
  vi.resetAllMocks();
  originalKubeconfig = process.env.KUBECONFIG;
  originalImage = process.env.PEPR_IMAGE;
  delete process.env.PEPR_IMAGE;
  get.mockResolvedValue({ items: [] });
  sleep.mockResolvedValue(undefined);
  command.mockImplementation(({ cmd }) =>
    Promise.resolve({
      ...success,
      stdout: cmd.startsWith("k3d kubeconfig write") ? ["/test/kubeconfig"] : [],
    }),
  );
});

afterEach(() => {
  if (originalImage === undefined) delete process.env.PEPR_IMAGE;
  else process.env.PEPR_IMAGE = originalImage;
  if (originalKubeconfig === undefined) delete process.env.KUBECONFIG;
  else process.env.KUBECONFIG = originalKubeconfig;
});

describe("up() readiness", () => {
  it("waits through a transient API readiness failure before listing resources", async () => {
    let probes = 0;
    command.mockImplementation(({ cmd, env }) => {
      if (cmd.startsWith("k3d kubeconfig write")) {
        return Promise.resolve({ ...success, stdout: ["/test/kubeconfig"] });
      }
      if (cmd.includes("/readyz")) {
        expect(env).toEqual({ KUBECONFIG: "/test/kubeconfig" });
        probes++;
        if (probes === 1) return Promise.reject(unavailable);
      }
      return Promise.resolve(success);
    });
    get.mockImplementation(() => {
      expect(probes).toBe(2);
      return Promise.resolve({ items: [] });
    });

    await expect(up("test-cluster")).resolves.toBe("/test/kubeconfig");
    expect(sleep).toHaveBeenCalledWith(1);
    expect(process.env.KUBECONFIG).toBe(originalKubeconfig);
  });

  it("restores an existing kubeconfig after discovery", async () => {
    process.env.KUBECONFIG = "/original/kubeconfig";
    await up("test-cluster");
    expect(process.env.KUBECONFIG).toBe("/original/kubeconfig");
  });

  it("retries a transient 503 during kind discovery", async () => {
    get.mockRejectedValueOnce({ status: 503 }).mockResolvedValue({ items: [] });
    await up("test-cluster");
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("bounds readiness attempts and restores kubeconfig on failure", async () => {
    process.env.KUBECONFIG = "/original/kubeconfig";
    command.mockImplementation(({ cmd }) => {
      if (cmd.includes("/readyz")) return Promise.reject(unavailable);
      return Promise.resolve({ ...success, stdout: ["/test/kubeconfig"] });
    });

    await expect(up("test-cluster")).rejects.toEqual(unavailable);
    expect(command.mock.calls.filter(([spec]) => spec.cmd.includes("/readyz"))).toHaveLength(20);
    expect(get).not.toHaveBeenCalled();
    expect(process.env.KUBECONFIG).toBe("/original/kubeconfig");
  });

  it("restores kubeconfig when kind discovery fails", async () => {
    process.env.KUBECONFIG = "/original/kubeconfig";
    const error = { status: 401 };
    get.mockRejectedValue(error);
    await expect(up("test-cluster")).rejects.toEqual(error);
    expect(process.env.KUBECONFIG).toBe("/original/kubeconfig");
  });
});
