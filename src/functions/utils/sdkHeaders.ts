import packageJson from "../../../package.json";

export const sdkHeaders = [{ header: "X-KC-SOURCE", value: `${packageJson.name};${packageJson.version}` }];
