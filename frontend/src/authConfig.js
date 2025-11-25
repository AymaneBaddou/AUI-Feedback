import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "23cd335f-5fe8-4395-b8b5-001eb3fa908b",
    authority: "https://login.microsoftonline.com/7025e04c-70ca-48bf-ab7b-73954cb846ad",

    // AUTO-DETECT redirect for localhost or Render
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message) => {
        if (level === LogLevel.Error) console.error(message);
      },
      logLevel: LogLevel.Info,
      piiLoggingEnabled: false,
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
