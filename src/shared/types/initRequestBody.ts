import { findMissingStringProps } from "../utils/findMissingStringProps";

export type InitRequestBody = Readonly<{
  projectId: string;
  language: string;
  slugCodename: string;
  algoliaAppId: string;
  algoliaIndexName: string;
}>;

export const isValidInitRequestBody = (body: Record<string, unknown>): body is InitRequestBody =>
  !findMissingStringProps(Object.keys(validRequestBody))(body).length;

const validRequestBody: InitRequestBody = ({
  projectId: '',
  language: '',
  slugCodename: '',
  algoliaAppId: '',
  algoliaIndexName: '',
});

export const findMissingInitRequestBodyProps =
  findMissingStringProps(Object.keys(validRequestBody));

