import { Elements, ElementType, IContentItem } from "@kontent-ai/delivery-sdk";

export type AlgoliaItem = Readonly<{
  id: string,
  objectID: string,
  codename: string,
  name: string,
  language: string,
  type: string,
  slug: string,
  collection: string,
  content: readonly ContentBlock[]
}>;

type ContentBlock = Readonly<{
  id: string,
  codename: string,
  name: string,
  type: string,
  language: string,
  collection: string,
  parents: readonly string[],
  contents: string
}>;

export const canConvertToAlgoliaItem = (expectedSlug: string) => (item: IContentItem): boolean =>
  !!item.elements[expectedSlug];

const createObjectId = (itemCodename: string, languageCodename: string) => `${itemCodename}_${languageCodename}`;

export const convertToAlgoliaItem = (allItems: ReadonlyMap<string, IContentItem>, expectedSlug: string) => (item: IContentItem): AlgoliaItem => ({
  id: item.system.id,
  type: item.system.type,
  codename: item.system.codename,
  collection: item.system.collection,
  name: item.system.name,
  language: item.system.language,
  objectID: createObjectId(item.system.codename, item.system.language),
  slug: Object.values(item.elements).find(el => el.type === ElementType.UrlSlug)?.value ?? '',
  content: createRecordBlock(allItems, [], expectedSlug)(item),
});

const createRecordBlock = (allItems: ReadonlyMap<string, IContentItem>, parentCodenames: ReadonlyArray<string>, expectedSlug: string) => (item: IContentItem): ReadonlyArray<ContentBlock> => {
  const content = Object.values(item.elements)
    .map(element => {
      switch (element.type) {
        case ElementType.Text:
          return element.value ?? '';
        case ElementType.RichText: {
          return element.value?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\n/g, ' ') ?? '';
        }
        default:
          return '';
      }
    });

  const children = Object.values(item.elements)
    .flatMap(element => {
      switch (element.type) {
        case ElementType.RichText: {
          const typedElement = element as Elements.RichTextElement;
          return typedElement.linkedItems
            .filter(i => !parentCodenames.includes(i.system.codename))
            .filter(i => !canConvertToAlgoliaItem(expectedSlug)(i))
            .flatMap(createRecordBlock(allItems, [item.system.codename, ...parentCodenames], expectedSlug));
        }
        case ElementType.ModularContent: {
          const typedElement = element as Elements.LinkedItemsElement;
          return typedElement.linkedItems
            .filter(i => !parentCodenames.includes(i.system.codename))
            .filter(i => !canConvertToAlgoliaItem(expectedSlug)(i))
            .flatMap(createRecordBlock(allItems, [item.system.codename, ...parentCodenames], expectedSlug));
        }
        default:
          return [];
      }
    });

  const thisBlock: ContentBlock = {
    id: item.system.id,
    type: item.system.type,
    codename: item.system.codename,
    collection: item.system.collection,
    name: item.system.name,
    language: item.system.language,
    contents: content.join(' ').replace('"', ''),
    parents: parentCodenames,
  };

  return [thisBlock, ...children];
};
