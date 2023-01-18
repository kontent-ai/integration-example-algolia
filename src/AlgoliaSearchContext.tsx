import { FC, ReactElement, useMemo } from 'react';
import { useConfig } from './ConfigContext';
import algoliasearch from 'algoliasearch';
import { Configure, InstantSearch } from 'react-instantsearch-hooks-web';
import { customUserAgent } from "./shared/algoliaUserAgent";

type Props = Readonly<{
  children: ReactElement;
}>;

export const AlgoliaSearchContext: FC<Props> = props => {
  const config = useConfig();
  const searchClient = useMemo(() =>
      algoliasearch(config.algoliaAppId, config.algoliaSearchKey, { userAgent: customUserAgent })
    , [config.algoliaAppId, config.algoliaSearchKey]);

  return (
    <InstantSearch indexName={config.algoliaIndexName} searchClient={searchClient}>
      <Configure facets={['language']} facetsRefinements={{ language: [config.language] }}/>
      {props.children}
    </InstantSearch>
  );
};

AlgoliaSearchContext.displayName = 'AlgoliaSearchContext';
