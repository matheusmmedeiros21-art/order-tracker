import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    log: {
      error: (...args: any[]) => void;
      info: (...args: any[]) => void;
      warn: (...args: any[]) => void;
      debug: (...args: any[]) => void;
    };
  }
}