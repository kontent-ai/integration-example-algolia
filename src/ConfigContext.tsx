import React, { FC, ReactElement, useContext, useEffect, useState } from 'react';

type Props = Readonly<{
  children: ReactElement | ReactElement[] | null;
}>

export const ConfigProvider: FC<Props> = props => {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    CustomElement.init((element, context) => {
      if (!isValidConfig(element.config)) {
        throw new Error(`Invalid element config, please check the documentation.`);
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


const Context = React.createContext<Config>({
  slugCodename: '',
  algoliaIndexName: '',
  algoliaSearchKey: '',
  algoliaAppId: '',
  language: '',
  projectId: '',
});

export const useConfig = () => useContext(Context);

type AlgoliaCustomElementConfig = Readonly<{
  algoliaAppId: string;
  algoliaSearchKey: string;
  algoliaIndexName: string;
  slugCodename: string;
}>;

export type Config = AlgoliaCustomElementConfig & Readonly<{
  projectId: string;
  language: string;
}>;

const isValidConfig = (c: Readonly<Record<string, unknown>> | null): c is AlgoliaCustomElementConfig =>
  c !== null &&
  hasStringProperty(nameOf<AlgoliaCustomElementConfig>('algoliaAppId'), c) &&
  hasStringProperty(nameOf<AlgoliaCustomElementConfig>('algoliaSearchKey'), c) &&
  hasStringProperty(nameOf<AlgoliaCustomElementConfig>('algoliaIndexName'), c) &&
  hasStringProperty(nameOf<AlgoliaCustomElementConfig>('slugCodename'), c);

const nameOf = <Object extends unknown>(prop: keyof Object) => prop;

const hasStringProperty = <PropName extends string, Input extends Record<string, unknown>>(propName: PropName, input: Input): input is Input & { [key in PropName]: string } =>
  input.hasOwnProperty(propName) &&
  typeof input[propName] === 'string';
