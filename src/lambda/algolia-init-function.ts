/* The principle of modeling modular content for search lies in the SLUG property 
 * The assumption being that every item that has a SLUG property
 * is being rendered on the website as a separate page, thus pages with slug are marked
 * as the ones that are being serached for + linked items with SLUG are being ignored 
 * while the content of a page is being modeled */

/* If your model does not support this assumption, you have to remodel the processing 
 * part of the function based on your model (i.e. use taxonomies instead of the slug property)
 * in order to model your data correcly inside of the search engine */
import { APIGatewayEvent, Context } from 'aws-lambda'

import { SearchProjectConfiguration, SearchableItem } from "./utils/search-model"

import AlgoliaClient from "./utils/algolia-client";
import KontentClient from './utils/kontent-client';

// @ts-ignore - netlify env. variable
const { ALGOLIA_API_KEY } = process.env

function getConfiguration(body: string): SearchProjectConfiguration {
  const jsonBody = JSON.parse(body);
  const config: SearchProjectConfiguration = {
    kontent: {
      projectId: jsonBody.projectId,
      language: jsonBody.language,
      slugCodename: jsonBody.slug
    },
    algolia: {
      appId: jsonBody.appId,
      apiKey: ALGOLIA_API_KEY,
      index: jsonBody.index
    }
  };

  return config;
}

/* FUNCTION HANDLER */
export async function handler(event: APIGatewayEvent, context: Context) {

  // Only receiving POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!event.body)
    return { statusCode: 200, body: [] };

  // parse config from the body & env. variables
  const config = getConfiguration(event.body);
  var kontentClient = new KontentClient(config.kontent);

  // get all content from Kontent
  const content = await kontentClient.getAllContentFromProject();

  // all items with a predefined slug property -> SEARCHABLE PAGES (indexed objects)
  const contentWithSlug = content.filter(item => item[config.kontent.slugCodename]);

  // creates a searchable structure based on the content's structure
  const searchableStructure = kontentClient.createSearchableStructure(contentWithSlug, content);

  // index the created content structure into algolia
  const algoliaClient = new AlgoliaClient(config.algolia);
  const indexedItems = await algoliaClient.indexSearchableStructure(searchableStructure);

  return {
    statusCode: 200,
    body: `${JSON.stringify(indexedItems)}`,
  };
};
