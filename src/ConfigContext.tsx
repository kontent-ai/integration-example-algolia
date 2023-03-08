import React, { FC, ReactElement, useContext, useEffect, useState } from 'react';
import { findMissingStringProps } from './shared/utils/findMissingStringProps';

type Props = Readonly<{
  children: ReactElement | ReactElement[] | null;
}>

export const ConfigProvider: FC<Props> = props => {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    CustomElement.init((element, context) => {
      if (!isValidConfig(element.config)) {
        throw new Error(`Invalid element config, the following properties are missing or invalid ${findMissingStringProps(Object.keys(emptyConfig))(element.config).join(', ')}`);
      }

      setConfig({
        ...element.config,
        projectId: context.projectId,
        language: context.variant.codename,
      });
    });
  }, []);

  if (!config) {
    return null;
  }

  return (
    <Context.Provider value={config}>
      {props.children}
    </Context.Provider>
  );
};

ConfigProvider.displayName = 'ConfigProvider';

export type Config = Readonly<{
  algoliaAppId: string;
  algoliaSearchKey: string;
  algoliaIndexName: string;
  slugCodename: string;
  projectId: string;
  language: string;
}>;

const emptyConfig: Config = {
  slugCodename: '',
  algoliaIndexName: '',
  algoliaSearchKey: '',
  algoliaAppId: '',
  language: '',
  projectId: '',
};

const Context = React.createContext<Config>(emptyConfig);

export const useConfig = () => useContext(Context);


const isValidConfig = (c: Readonly<Record<string, unknown>> | null): c is Config =>
  !findMissingStringProps(Object.keys(emptyConfig))(c).length;

