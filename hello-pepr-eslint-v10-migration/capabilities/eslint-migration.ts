// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023-Present The Pepr Authors

import { Capability, a } from "pepr";

export const EslintMigration = new Capability({
  name: "eslint-migration",
  description: "Minimal capability used to test pepr format across eslint v9 -> v10 migration",
  namespaces: [],
});

const { When } = EslintMigration;

When(a.ConfigMap)
  .IsCreated()
  .Mutate(cm => {
    cm.SetLabel("pepr.dev/eslint-migration", "true");
  });
