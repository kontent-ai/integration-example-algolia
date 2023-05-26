export const createEnvVars = <VarNames extends readonly string[]>(varNames: VarNames) => {
  const envVars = Object.fromEntries(varNames.map(n => [n, process.env[n]]));

  return {
    envVars,
    missingEnvVars: Object.entries(envVars).filter(([, v]) => v === undefined).map(([n]) => n),
  } as const;
};
