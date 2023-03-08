import { hasStringProperty, nameOf } from "../utils/typeguards";

export type InitRequestBody = Readonly<{
  projectId: string;
  language: string;
  slugCodename: string;
  algoliaAppId: string;
  algoliaIndexName: string;
}>;

export const isValidInitRequestBody = (body: Record<string, unknown>): body is InitRequestBody =>
  hasStringProperty(nameOf<InitRequestBody>('projectId'), body) &&
  hasStringProperty(nameOf<InitRequestBody>('language'), body) &&
  hasStringProperty(nameOf<InitRequestBody>('slugCodename'), body) &&
  hasStringProperty(nameOf<InitRequestBody>('algoliaAppId'), body) &&
  hasStringProperty(nameOf<InitRequestBody>('algoliaIndexName'), body);

