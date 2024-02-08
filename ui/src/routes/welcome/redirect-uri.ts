import { endpoint } from "../../utils/endpoints";
import { uiHost } from "../../utils/env";

export const redirectUri = new URL(endpoint("/login/google/redirect"), uiHost)
  .href;
