import { APIGatewayEvent, APIGatewayProxyEventQueryStringParameters, Context } from 'aws-lambda'

import { IWebhookDeliveryResponse, IWebhookDeliveryItem, SignatureHelper } from "@kentico/kontent-webhook-helper";

import { SearchableItem, SearchProjectConfiguration } from "./utils/search-model"
import AlgoliaClient from "./utils/algolia-client";
import KontentClient from './utils/kontent-client';
import { ContentItem } from '@kentico/kontent-delivery';

// @ts-ignore - netlify env. variable
const { ALGOLIA_API_KEY, KONTENT_SECRET } = process.env;

function getConfiguration(webhook: IWebhookDeliveryResponse, queryParams: APIGatewayProxyEventQueryStringParameters | null): SearchProjectConfiguration | null {
  if (!queryParams || !queryParams.slug || !queryParams.appId || !queryParams.index) {
    return null;
  }
  const config: SearchProjectConfiguration = {
    kontent: {
      projectId: webhook.message.project_id,
      slugCodename: queryParams.slug,
    },
    algolia: {
      appId: queryParams.appId,
      apiKey: ALGOLIA_API_KEY,
      index: queryParams.index
    }
  };
  return config;
}

// processes affected content (about which we have been notified by the webhook)
async function processNotIndexedContent(codename: string, language: string, config: SearchProjectConfiguration) {
  const kontentConfig = config.kontent;
  kontentConfig.language = language;
  const kontentClient = new KontentClient(kontentConfig);

  // get all content for requested codename
  const content: ContentItem[] = await kontentClient.getAllContentForCodename(codename);
  const itemFromDelivery = content.find(item => item.system.codename == codename);

  // the item has slug => new record
  if (itemFromDelivery && itemFromDelivery[config.kontent.slugCodename]) {
    // creates a searchable structure based on the content's structure
    const searchableStructure = kontentClient.createSearchableStructure([itemFromDelivery], content);
    return searchableStructure;
  }

  return [];
}

// processes affected content (about which we have been notified by the webhook)
async function processIndexedContent(codename: string, language: string, config: SearchProjectConfiguration, algoliaClient: AlgoliaClient) {
  const kontentConfig = config.kontent;
  kontentConfig.language = language;
  const kontentClient = new KontentClient(kontentConfig);

  // get all content for requested codename
  const content: ContentItem[] = await kontentClient.getAllContentForCodename(codename);
  const itemFromDelivery = content.find(item => item.system.codename == codename);

  // nothing found in Kontent => item has been removed
  if (!itemFromDelivery) {
    await algoliaClient.removeFromIndex([codename]);
    return [];
  }

  // some content has been found => update existing item by processing it once again
  const searchableStructure = kontentClient.createSearchableStructure([itemFromDelivery], content);
  return searchableStructure;
}

/* FUNCTION HANDLER */
export async function handler(event: APIGatewayEvent, context: Context) {

  // Only receiving POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Empty body
  if (!event.body) {
    return { statusCode: 400, body: "Missing Data" };
  }

  // Consistency check - make sure your netlify enrionment variable and your webhook secret matches
  /*if (!event.headers['x-kc-signature'] || !SignatureHelper.isValidSignatureFromString(event.body, KONTENT_SECRET, event.headers['x-kc-signature'])) {
    return { statusCode: 401, body: "Unauthorized" };
  }*/

  const webhook: IWebhookDeliveryResponse = JSON.parse(event.body);

  // create configuration from the webhook body/query params
  const config = getConfiguration(webhook, event.queryStringParameters);
  if (!config) {
    return { statusCode: 400, body: "Missing Parameters" };
  }

  const algoliaClient = new AlgoliaClient(config.algolia);
  const itemsToIndex: SearchableItem[] = [];

  // go through updated items
  for (const affectedItem of webhook.data.items) {
    // we are looking for the ultimate "parent"/indexed item that contains the content that has been updated

    // found an item in algolia
    const foundItems: SearchableItem[] = await algoliaClient.searchIndex(affectedItem.codename, affectedItem.language);

    // item not found in algolia  => new content to be indexed?
    if (foundItems.length == 0) {
      itemsToIndex.push(...await processNotIndexedContent(affectedItem.codename, affectedItem.language, config));
    }

    // we actually found some items in algolia => update or delete?
    for (const foundItem of foundItems) {
      itemsToIndex.push(...await processIndexedContent(foundItem.codename, foundItem.language, config, algoliaClient));
    }
  }

  const uniqueItems = Array.from(new Set(itemsToIndex.map(item => item.codename))).map(codename => { return itemsToIndex.find(item => item.codename === codename) });
  const indexedItems: string[] = await algoliaClient.indexSearchableStructure(uniqueItems);
  
  return {
    statusCode: 200,
    body: `${JSON.stringify(indexedItems)}`,
  };
}

