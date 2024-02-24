import { raise } from "@spill-it/utils/errors";
import {
  Key,
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  LoaderFunction,
  useLoaderData,
  useRouteLoaderData,
} from "react-router-dom";
import { logger } from "./logger";

/**
 * Used mainly to stop effects on unmounts,
 * kind of like `AbortController` for fetches.
 */
export type Controller = {
  shouldProceed: boolean;
};

let key = 0;
export const randomKey = (): Key => key++;

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

/**
 * Loosely follows an NPM package
 * - https://www.npmjs.com/package/react-intersection-observer
 */
export function useObserver<T extends Element>() {
  const [isIntersecting, setIsIntersecting] = useState(false);

  const elementRef = useRef<T | null>(null);
  useEffect(() => {
    const element = elementRef.current;
    if (element === null) {
      logger.warn("Element to observe does not exist? Ignoring...");
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.length > 1) {
        logger.warn("Multiple elements observed? Ignoring...");
        return;
      }

      const entry = entries[0];
      if (entry === undefined) {
        logger.warn("Observed element does not exist? Ignoring...");
        return;
      }

      // TODO Also have state for entry?
      setIsIntersecting(entry.isIntersecting);
    });

    observer.observe(element);
    return () => {
      observer.unobserve(element);
    };
  }, []);

  return [elementRef, isIntersecting] as const;
}

/**
 * - https://stackoverflow.com/q/74877170
 * - https://github.com/remix-run/react-router/discussions/9792
 */
type LoaderData<TLoader extends LoaderFunction> =
  Awaited<ReturnType<TLoader>> extends Response | infer D ? D : never;
export function useTypedLoaderData<TLoader extends LoaderFunction>() {
  return useLoaderData() as LoaderData<TLoader>;
}

export function createLoader<T extends LoaderFunction>(
  routeId: string,
  loader: T,
) {
  function useLoader() {
    return useRouteLoaderData(routeId) as LoaderData<T>;
  }

  return [loader, useLoader] as const;
}
