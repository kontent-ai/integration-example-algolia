type ElementInfo = Readonly<{
  config: Readonly<Record<string, unknown>> | null;
  disabled: boolean;
  value: string;
}>

type ElementContext = Readonly<{
  projectId: string;
  variant: Readonly<{
    id: Uuid;
    codename: string;
  }>;
}>;

declare const CustomElement: {
  setHeight: (height: number) => void;
  init: (callback: (element: ElementInfo, context: ElementContext) => void) => void;
  onDisabledChanged: (callback: (isDisabled: boolean) => void) => void;
  setValue: (newValue: string | null) => void;
};
