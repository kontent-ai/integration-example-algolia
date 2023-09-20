import { hasStringProperty } from "./typeguards";

export const findMissingStringProps =
  (expectedProps: ReadonlyArray<string>) => (body: Record<string, unknown> | null): ReadonlyArray<string> =>
    expectedProps
      .filter(key => !hasStringProperty(key, body));
