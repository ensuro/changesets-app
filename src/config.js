const env = import.meta.env;

export const CHANGESET_URL_PREFIX = env.VITE_CHANGESET_URL_PREFIX || "";

export const ADDRESSBOOK_URL = env.VITE_ADDRESSBOOK_URL || "/addressBook.json";

export const SAFE_API_KEY = env.VITE_SAFE_API_KEY || "";

export const ENVIRONMENT = {
  name: env.VITE_ENV_NAME,
  version: env.VITE_ENV_VERSION || "development",
};
