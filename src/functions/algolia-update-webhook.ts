import { DeliveryClient, IContentItem } from "@kontent-ai/delivery-sdk";
import { IWebhookDeliveryResponse, SignatureHelper } from "@kontent-ai/webhook-helper";
import { Handler } from "@netlify/functions";
import createAlgoliaClient, { SearchIndex } from "algoliasearch";

import { customUserAgent } from "../shared/algoliaUserAgent";
import { hasStringProperty, nameOf } from "../shared/utils/typeguards";
import { AlgoliaItem, canConvertToAlgoliaItem, convertToAlgoliaItem } from "./utils/algoliaItem";
import { createEnvVars } from "./utils/createEnvVars";
import { sdkHeaders } from "./utils/sdkHeaders";
import { serializeUncaughtErrorsHandler } from "./utils/serializeUncaughtErrorsHandler";

const { envVars, missingEnvVars } = createEnvVars(["KONTENT_SECRET", "ALGOLIA_API_KEY"] as const);

export const handler: Handler = serializeUncaughtErrorsHandler(async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!event.body) {
    return { statusCode: 400, body: "Missing Data" };
  }

  if (!envVars.KONTENT_SECRET || !envVars.ALGOLIA_API_KEY) {
    return {
      statusCode: 500,
      body: `${missingEnvVars.join(", ")} environment variables are missing, please check the documentation`,
    };
  }

  // Consistency check - make sure your netlify environment variable and your webhook secret matches
  const signatureHelper = new SignatureHelper();
  if (
    !event.headers["x-kc-signature"]
    || !signatureHelper.isValidSignatureFromString(event.body, envVars.KONTENT_SECRET, event.headers["x-kc-signature"])
  ) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const webhookData: IWebhookDeliveryResponse = JSON.parse(event.body);

  const queryParams = event.queryStringParameters;
  if (!areValidQueryParams(queryParams)) {
    return { statusCode: 400, body: "Missing some query parameters, please check the documentation" };
  }

  const algoliaClient = createAlgoliaClient(queryParams.appId, envVars.ALGOLIA_API_KEY, { userAgent: customUserAgent });
  const index = algoliaClient.initIndex(queryParams.index);

  const deliverClient = new DeliveryClient({
    projectId: webhookData.message.project_id,
    globalHeaders: () => sdkHeaders,
  });

  const actions = (await Promise.all(webhookData.data.items
    .map(async item => {
      const existingAlgoliaItems = await findAgoliaItems(index, item.codename, item.language);

      if (!existingAlgoliaItems.length) {
        const deliverItems = await findDeliverItemWithChildrenByCodename(deliverClient, item.codename, item.language);
        const deliverItem = deliverItems.get(item.codename);

        return [{
          objectIdsToRemove: [],
          recordsToReindex: deliverItem && canConvertToAlgoliaItem(queryParams.slug)(deliverItem)
            ? [convertToAlgoliaItem(deliverItems, queryParams.slug)(deliverItem)]
            : [],
        }];
      }

      return Promise.all(existingAlgoliaItems
        .map(async i => {
          const deliverItems = await findDeliverItemWithChildrenByCodename(deliverClient, i.codename, i.language);
          const deliverItem = deliverItems.get(i.codename);

          return deliverItem
            ? {
              objectIdsToRemove: [] as string[],
              recordsToReindex: [convertToAlgoliaItem(deliverItems, queryParams.slug)(deliverItem)],
            }
            : { objectIdsToRemove: [i.objectID], recordsToReindex: [] };
        }));
    }))).flat();

  const recordsToReIndex = [
    ...new Map(actions.flatMap(a => a.recordsToReindex.map(i => [i.codename, i] as const))).values(),
  ];
  const objectIdsToRemove = [...new Set(actions.flatMap(a => a.objectIdsToRemove))];

  const reIndexResponse = recordsToReIndex.length ? await index.saveObjects(recordsToReIndex).wait() : undefined;
  const deletedResponse = objectIdsToRemove.length ? await index.deleteObjects(objectIdsToRemove).wait() : undefined;

  return {
    statusCode: 200,
    body: JSON.stringify({
      deletedObjectIds: deletedResponse?.objectIDs ?? [],
      reIndexedObjectIds: reIndexResponse?.objectIDs ?? [],
    }),
    contentType: "application/json",
  };
});

const findAgoliaItems = async (index: SearchIndex, itemCodename: string, languageCodename: string) => {
  try {
    const response = await index.search<AlgoliaItem>("", {
      facetFilters: [`content.codename: ${itemCodename}`, `language: ${languageCodename}`],
    });

    return response.hits;
  } catch {
    return [];
  }
};

const findDeliverItemWithChildrenByCodename = async (
  deliverClient: DeliveryClient,
  codename: string,
  languageCodename: string,
): Promise<ReadonlyMap<string, IContentItem>> => {
  try {
    const response = await deliverClient
      .item(codename)
      .queryConfig({ waitForLoadingNewContent: true })
      .languageParameter(languageCodename)
      .depthParameter(100)
      .toPromise();

    return new Map([response.data.item, ...Object.values(response.data.linkedItems)].map(i => [i.system.codename, i]));
  } catch {
    return new Map();
  }
};

type ExpectedQueryParams = Readonly<{
  slug: string;
  appId: string;
  index: string;
}>;

const areValidQueryParams = (v: Record<string, unknown> | null): v is ExpectedQueryParams =>
  v !== null
  && hasStringProperty(nameOf<ExpectedQueryParams>("slug"), v)
  && hasStringProperty(nameOf<ExpectedQueryParams>("appId"), v)
  && hasStringProperty(nameOf<ExpectedQueryParams>("index"), v);
