type KontentWebhookModel = {
  data: KontentWebhookData,
  message: KontentWebhookMessage
}

type KontentWebhookData = {
  items: KontentWebhookItem[]
  taxonomies: KontentWebhookTaxonomy[]
}

type KontentWebhookItem = {
  id: string,
  codename: string,
  language: string,
  type: string
}

type KontentWebhookTaxonomy = {
  id: string,
  codename: string
}

type KontentWebhookMessage = {
  id: string,
  project_id: string,
  type: string,
  operation: string,
  api_name: string,
  created_timestamp: string,
  webhook_url: string
}

export { KontentWebhookModel, KontentWebhookData, KontentWebhookMessage, KontentWebhookItem, KontentWebhookTaxonomy }