import { PublicKey } from "@solana/web3.js";
import type { Environment, ZeroConfig } from "./types";
import { array, assert, enums, object, string } from "superstruct";
import type { Infer } from "superstruct";
import configs from "./configs.json";

const ZeroConfigRaw = object({
  label: enums([
    "production",
    "staging",
    "staging-mainnet-clone",
    "staging-alt",
  ]),
  program: string(),
  group: string(),
});
const ConfigRaw = array(ZeroConfigRaw);

export type ZeroConfigRaw = Infer<typeof ZeroConfigRaw>;
export type ConfigRaw = Infer<typeof ConfigRaw>;

function parseConfig(configRaw: ZeroConfigRaw): ZeroConfig {
  return {
    environment: configRaw.label,
    programId: new PublicKey(configRaw.program),
    groupPk: new PublicKey(configRaw.group),
  };
}

function parseConfigs(configRaw: ConfigRaw): {
  [label: string]: ZeroConfig;
} {
  return configRaw.reduce(
    (config, current, _) => ({
      [current.label]: parseConfig(current),
      ...config,
    }),
    {} as {
      [label: string]: ZeroConfig;
    }
  );
}

function loadDefaultConfig(): {
  [label: string]: ZeroConfig;
} {
  assert(configs, ConfigRaw);
  return parseConfigs(configs);
}

/**
 * Define marginfi-specific config per profile
 *
 * @internal
 */
function getZeroConfig(
  environment: Environment,
  overrides?: Partial<Omit<ZeroConfig, "environment">>
): ZeroConfig {
  const defaultConfigs = loadDefaultConfig();

  const defaultConfig = defaultConfigs[environment]!;
  return {
    environment,
    programId: overrides?.programId || defaultConfig.programId,
    groupPk: overrides?.groupPk || defaultConfig.groupPk,
  };
}

/**
 * Retrieve config per environment
 */
export function getConfig(
  environment: Environment = "production",
  overrides?: Partial<Omit<ZeroConfig, "environment">>
): ZeroConfig {
  return {
    ...getZeroConfig(environment, overrides),
  };
}
