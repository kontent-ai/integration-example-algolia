import { FC, useState } from "react";

import { AlgoliaSearch } from "./AlgoliaSearch";
import { AlgoliaSearchContext } from "./AlgoliaSearchContext";
import { AlgoliaSync } from "./AlgoliaSync";

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

AlgoliaElement.displayName = "AlgoliaElement";
