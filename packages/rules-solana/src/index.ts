import { attributesMatchRule } from "./attributes-match.js";
import { byteLengthsRule } from "./byte-lengths.js";
import { corePluginsRule } from "./core-plugins.js";
import { creatorsFeeRule } from "./creators-fee.js";
import { imageInFilesRule } from "./image-in-files.js";
import { solanaRequiredRule } from "./required-fields.js";

export const solanaRules = [
  solanaRequiredRule,
  imageInFilesRule,
  byteLengthsRule,
  creatorsFeeRule,
  corePluginsRule,
  attributesMatchRule,
];

export {
  attributesMatchRule,
  byteLengthsRule,
  corePluginsRule,
  creatorsFeeRule,
  imageInFilesRule,
  solanaRequiredRule,
};
