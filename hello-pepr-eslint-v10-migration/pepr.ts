// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023-Present The Pepr Authors

import { PeprModule } from "pepr";
import cfg from "./package.json";

import { EslintMigration } from "./capabilities/eslint-migration";

new PeprModule(cfg, [EslintMigration]);
