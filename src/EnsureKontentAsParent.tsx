import { FC, ReactElement } from "react";

type Props = Readonly<{
  children: ReactElement | ReactElement[] | null;
}>

export const EnsureKontentAsParent: FC<Props> = props => {
  if (window === window.top) {
    return (
      <h1 style={{ lineHeight: 1.5 }}>
        This can only be rendered as a custom element in the Kontent.ai app. See <a href={helpLink} target="_blank" rel="noreferrer">the documentation</a> for more information.
      </h1>
    );
  }

  return <>{props.children}</>;
};

EnsureKontentAsParent.displayName = 'EnsureKontentAsParent';

const helpLink = 'https://kontent.ai/learn/tutorials/develop-apps/integrate/content-editing-extensions/#a-add-the-custom-element-to-your-project';
