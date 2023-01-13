/* The principle of modeling modular content for search lies in the SLUG property 
 * The assumption being that every item that has a SLUG property
 * is being rendered on the website as a separate page, thus pages with slug are marked
 * as the ones that are being searched for + linked items with SLUG are being ignored
 * while the content of a page is being modeled */

/* If your model does not support this assumption, you have to remodel the processing
 * part of the function based on your model (i.e. use taxonomies instead of the slug property)
 * in order to model your data correctly inside of the search engine */
import { Handler } from '@netlify/functions';
import { DeliveryClient, IContentItem } from '@kontent-ai/delivery-sdk';
import { canConvertToAlgoliaItem, convertToAlgoliaItem } from './utils/algoliaItem';
import createAlgoliaClient from 'algoliasearch';
import { hasStringProperty, nameOf } from './utils/typeguards';
import { customUserAgent } from "../shared/algoliaUserAgent";

const { ALGOLIA_API_KEY } = process.env;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = JSON.parse(event.body || 'null');
  if (!isValidBody(body)) {
    return { statusCode: 400, body: 'Missing or invalid body, please check the documentation' };
  }
  if (!ALGOLIA_API_KEY) {
    return { statusCode: 500, body: 'Some environment variables are missing, please check the documentation' };
  }

  const deliverClient = new DeliveryClient({ projectId: body.projectId });
  const allItems = await getAllContentFromProject(deliverClient, body.language);
  const allItemsMap = new Map(allItems.map(i => [i.system.codename, i]));
  const recordItems = allItems
    .filter(canConvertToAlgoliaItem(body.slug))
    .map(convertToAlgoliaItem(allItemsMap, body.slug));

  const algoliaClient = createAlgoliaClient(body.appId, ALGOLIA_API_KEY, { userAgent: customUserAgent });
  const index = algoliaClient.initIndex(body.index);
  await index.setSettings({
    searchableAttributes: ['content.contents', 'content.name', 'name'],
    attributesForFaceting: ['content.codename', 'language'],
    attributesToSnippet: ['content.contents:80'],
  }).wait();
  const result = await index.saveObjects(recordItems).wait();

  return {
    statusCode: 200,
    body: JSON.stringify(result.objectIDs),
  };
};

const getAllContentFromProject = async (deliverClient: DeliveryClient, languageCodename: string): Promise<IContentItem[]> => {
  const feed = await deliverClient.items().queryConfig({ waitForLoadingNewContent: true })
    .languageParameter(languageCodename).equalsFilter('system.language', languageCodename).toPromise();

  return [...feed.data.items, ...Object.values(feed.data.linkedItems)];
};

type BodyConfig = Readonly<{
  projectId: string;
  language: string;
  slug: string;
  appId: string;
  index: string;
}>;

const isValidBody = (body: Record<string, unknown>): body is BodyConfig =>
  hasStringProperty(nameOf<BodyConfig>('projectId'), body) &&
  hasStringProperty(nameOf<BodyConfig>('language'), body) &&
  hasStringProperty(nameOf<BodyConfig>('slug'), body) &&
  hasStringProperty(nameOf<BodyConfig>('appId'), body) &&
  hasStringProperty(nameOf<BodyConfig>('index'), body);
