import { animationUrlRule, externalUrlRule, youtubeUrlRule } from "./urls.js";
import { attributesRule } from "./attributes.js";
import { backgroundColorRule } from "./background-color.js";
import { contractUriRule } from "./contract-uri.js";
import { eip2981Rule } from "./eip2981.js";
import { erc1155DecimalsRule } from "./erc1155-decimals.js";
import { erc1155IdRule } from "./erc1155-id.js";
import { erc1155LocalizationRule } from "./erc1155-localization.js";
import { requiredFieldsRule } from "./required-fields.js";
import { tokenUriRule } from "./token-uri.js";

export const evmRules = [
  requiredFieldsRule,
  erc1155IdRule,
  erc1155DecimalsRule,
  erc1155LocalizationRule,
  attributesRule,
  backgroundColorRule,
  externalUrlRule,
  animationUrlRule,
  youtubeUrlRule,
  contractUriRule,
  eip2981Rule,
  tokenUriRule,
];

export {
  animationUrlRule,
  attributesRule,
  backgroundColorRule,
  contractUriRule,
  eip2981Rule,
  erc1155DecimalsRule,
  erc1155IdRule,
  erc1155LocalizationRule,
  externalUrlRule,
  requiredFieldsRule,
  tokenUriRule,
  youtubeUrlRule,
};
