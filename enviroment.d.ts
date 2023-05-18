declare global {
    namespace NodeJS {
      interface ProcessEnv {
        API_KEY: string;
        SKANSKA_URL: string;
      }
    }
  }
  export {};