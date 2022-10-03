import React, { FC, useState } from 'react';
import { AlgoliaSync } from './AlgoliaSync';
import { AlgoliaSearchContext } from './AlgoliaSearchContext';
import { AlgoliaSearch } from './AlgoliaSearch';

export const AlgoliaElement: FC = () => {
  const [searchIndexKey, setSearchIndexKey] = useState(0);

  return (
    <>
      <AlgoliaSync onSyncDone={() => setSearchIndexKey(prev => prev + 1)} />
      <AlgoliaSearchContext>
        <AlgoliaSearch searchIndexKey={`${searchIndexKey}`} />
      </AlgoliaSearchContext>
    </>
  );
};

AlgoliaElement.displayName = 'AlgoliaElement';
