const env = import.meta.env;

export const CHANGESET_URL_PREFIX = env.VITE_CHANGESET_URL_PREFIX || "";

export const ADDRESSBOOK_URL = env.VITE_ADDRESSBOOK_URL || "/addressBook.json";

export const SAFE_API_KEY = import.meta.env.VITE_SAFE_API_KEY || "";
