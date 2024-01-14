import { localizeLogger } from "./logger";

const logger = localizeLogger(import.meta.url);

function buildKeySequence(key: string, parent: string, sep = "/") {
  if (key === "/" && parent === "") {
    return "/";
  }
  if (key === "/") {
    return parent;
  }
  return `${parent}${sep}${key}`;
}

type EndpointMap = { [key: string]: EndpointMap | string };
/** Heavily based on https://stackoverflow.com/a/65883097 */
function assignEndpoints(obj: EndpointMap, parent = "") {
  for (const [key, value] of Object.entries(obj)) {
    const sequence = buildKeySequence(key, parent);

    if (typeof value === "object") {
      assignEndpoints(value, sequence);
    } else {
      obj[key] = sequence;
    }
  }
}

export const endpoints = {
  "/": "",
  api: {
    v0: {
      login: {
        "/": "",
        google: {
          "/": "",
          redirect: "",
        },
        "google-manual": {
          "/": "",
          redirect: "",
        },
      },
      logout: "",
      users: { me: "" },
    },
  },
  try: {
    hello: "",
    sample: "",
    protected: "",
    unprotected: "",
    "not-found": "",
    error: "",
    ui: {
      login: {
        google: {
          "/": "",
          redirect: "",
        },
      },
    },
  },
};
assignEndpoints(endpoints);
logger.info(
  "Using the following endpoints: " + JSON.stringify(endpoints, undefined, 1)
);
