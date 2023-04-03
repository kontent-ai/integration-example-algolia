import { createUserAgent } from "@algolia/transporter";
import algoliasearch from "algoliasearch";

import packageJson from "../../package.json";

export const customUserAgent = createUserAgent(algoliasearch.version)
  .add({ segment: packageJson.name, version: packageJson.version });
