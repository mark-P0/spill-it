import { zodPost, zodSample, zodUser } from "@spill-it/db/schema";
import { z } from "zod";

export const endpointMap = {
  "/api/v0/sessions": {
    GET: {
      input: z.object({
        headers: z.preprocess(
          (value) => {
            const isObjectWithLowercaseAuth =
              typeof value === "object" &&
              value !== null &&
              "authorization" in value;
            if (isObjectWithLowercaseAuth) {
              return {
                Authorization: value.authorization,
              };
            }
            return value;
          },
          z.object({
            Authorization: z.string(),
          }),
        ),
      }),
      output: z.object({
        data: z.object({
          scheme: z.string(),
          id: z.string(),
        }),
      }),
    },
  },
  "/api/v0/users/me": {
    GET: {
      input: z.object({
        headers: z.preprocess(
          (value) => {
            const isObjectWithLowercaseAuth =
              typeof value === "object" &&
              value !== null &&
              "authorization" in value;
            if (isObjectWithLowercaseAuth) {
              return {
                Authorization: value.authorization,
              };
            }
            return value;
          },
          z.object({
            Authorization: z.string(),
          }),
        ),
      }),
      output: z.object({
        data: zodUser,
      }),
    },
  },
  "/api/v0/links/google": {
    GET: {
      input: z.object({
        query: z.object({
          redirectUri: z.string().url(),
        }),
      }),
      output: z.object({
        link: z.string().url(),
      }),
    },
  },
  "/api/v0/posts": {
    POST: {
      input: z.object({
        headers: z.preprocess(
          (value) => {
            const isObjectWithLowercaseAuth =
              typeof value === "object" &&
              value !== null &&
              "authorization" in value;
            if (isObjectWithLowercaseAuth) {
              return {
                Authorization: value.authorization,
              };
            }
            return value;
          },
          z.object({
            Authorization: z.string(),
          }),
        ),
        body: z.object({
          content: z.string(),
        }),
      }),
      output: z.object({
        data: zodPost,
        links: z.object({
          self: z.string().url(),
        }),
      }),
    },
  },
  "/api/v0/posts/:postId": {
    // TODO Implement!
    GET: {
      input: z.object({}),
      output: z.object({}),
    },
  },
  "/try/hello": {
    GET: {
      input: z.object({
        query: z.object({
          who: z.string().optional(),
        }),
      }),
      output: z.object({
        hello: z.string(),
      }),
    },
  },
  "/try/samples": {
    GET: {
      input: z.object({}),
      output: z.object({
        data: z.array(zodSample),
      }),
    },
  },
  "/try/not-found": {
    GET: {
      input: z.object({}),
      output: z.object({}),
    },
  },
  "/try/error": {
    GET: {
      input: z.object({}),
      output: z.object({}),
    },
  },
  "/try/unprotected": {
    GET: {
      input: z.object({}),
      output: z.object({
        data: z.object({
          resource: z.string(),
          access: z.literal(true),
        }),
      }),
    },
  },
  "/try/protected": {
    GET: {
      input: z.object({
        headers: z.preprocess(
          (value) => {
            const isObjectWithLowercaseAuth =
              typeof value === "object" &&
              value !== null &&
              "authorization" in value;
            if (isObjectWithLowercaseAuth) {
              return {
                Authorization: value.authorization,
              };
            }
            return value;
          },
          z.object({
            Authorization: z.string(),
          }),
        ),
      }),
      output: z.object({
        data: z.object({
          resource: z.string(),
          access: z.string(),
        }),
      }),
    },
  },
  "/try/ui/login/google": {
    GET: {
      input: z.object({}),
      output: z.object({
        redirect: z.string().url(),
      }),
    },
  },
  "/try/ui/login/google/redirect": {
    GET: {
      input: z.object({
        query: z.object({
          code: z.string(),
        }),
      }),
      output: z.object({
        data: z.object({
          code: z.string(),
          redirectUri: z.string(),
        }),
        headers: z.object({
          Authorization: z.string(),
        }),
      }),
    },
  },
};

// TODO Type endpoint map statically? Would lose information about the schema...
/** Check endpoint map via types */
{
  type Method = "GET" | "POST" | "PUT" | "DELETE"; // Add more types here to be checked
  type Signature = {
    input: z.AnyZodObject;
    output: z.AnyZodObject;
  };

  endpointMap satisfies Record<
    string, // Endpoints refer to a string path
    Partial<
      // Endpoints can have a subset of the specified methods
      Record<Method, Signature> // Methods must follow the signature
    >
  >;
}

type EndpointMap = typeof endpointMap;
export type Endpoint = keyof EndpointMap;
export type EndpointMethod<T extends Endpoint> = keyof EndpointMap[T];

/**
 * - https://github.com/microsoft/TypeScript/issues/54289
 * - https://github.com/microsoft/TypeScript/issues/21760
 */
export type EndpointOutput<
  T extends Endpoint,
  U extends EndpointMethod<T>,
> = z.infer<
  EndpointMap[T][U] extends infer TSignature
    ? TSignature extends { output: infer TOutput }
      ? TOutput
      : never
    : never
>;
export type EndpointInput<
  T extends Endpoint,
  U extends EndpointMethod<T>,
> = z.infer<
  EndpointMap[T][U] extends infer TSignature
    ? TSignature extends { input: infer TInput }
      ? TInput
      : never
    : never
>;

export const endpoints = Object.keys(endpointMap) as Endpoint[];

export const endpoint = <T extends Endpoint>(endpoint: T): T => endpoint;

export function endpointDetails<
  T extends Endpoint,
  U extends EndpointMethod<T> & string,
>(endpoint: T, method: U) {
  const signature = endpointMap[endpoint][method];
  const methodLowercase = method.toLowerCase() as Lowercase<U>;
  return [endpoint, method, signature, methodLowercase] as const;
}
