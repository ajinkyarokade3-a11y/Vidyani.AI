export type GoogleCodeResponse = {
  code?: string;
  error?: string;
};

export type GoogleCodeClient = {
  requestCode: () => void;
};

export type GoogleAccountsOAuth = {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode: "popup";
    callback: (response: GoogleCodeResponse) => void;
  }) => GoogleCodeClient;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOAuth;
      };
    };
  }
}
