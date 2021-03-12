type KontentConfiguration = {
  projectId: string,
  language?: string,
  slugCodename: string
}

type AlgoliaConfiguration = {
  appId: string,
  apiKey: string,
  index: string
}

type SearchProjectConfiguration = {
  kontent: KontentConfiguration,
  algolia: AlgoliaConfiguration
}

type SearchableItem = {
  objectID: string,
  codename: string,
  name: string,
  language: string,
  slug: string,
  content: ContentBlock[]
}

type ContentBlock = {
  codename: string,
  name: string,
  language: string,
  parents: string[],
  contents: string
}

export { SearchProjectConfiguration, SearchableItem, ContentBlock, AlgoliaConfiguration, KontentConfiguration }