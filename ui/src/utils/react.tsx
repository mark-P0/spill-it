import { raise } from "@spill-it/utils/errors";
import { Key, PropsWithChildren, createContext, useContext } from "react";
import { LoaderFunction, useLoaderData } from "react-router-dom";

export function createNewContext<T>(useContextValue: () => T) {
  const NewContext = createContext<T | null>(null);

  function useNewContext(): T {
    const values =
      useContext(NewContext) ?? raise("Context possibly not provided");
    return values;
  }

  function NewContextProvider(props: PropsWithChildren) {
    const { children } = props;
    const value = useContextValue();
    return <NewContext.Provider value={value}>{children}</NewContext.Provider>;
  }

  return [useNewContext, NewContextProvider] as const;
}

let key = 0;
export const randomKey = (): Key => key++;

/**
 * - https://stackoverflow.com/q/74877170
 * - https://github.com/remix-run/react-router/discussions/9792
 */
type LoaderData<TLoader extends LoaderFunction> =
  Awaited<ReturnType<TLoader>> extends Response | infer D ? D : never;
export function useTypedLoaderData<TLoader extends LoaderFunction>() {
  return useLoaderData() as LoaderData<TLoader>;
}
