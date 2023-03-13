import { hasStringProperty } from "./typeguards";

export const findMissingStringProps = (expectedProps: ReadonlyArray<string>) =>
  (body: Record<string, unknown> | null): ReadonlyArray<string> =>
    Object.keys(expectedProps)
      .filter(key => !hasStringProperty(key, body))

