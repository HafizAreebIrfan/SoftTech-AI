import { Express } from "express";
import helmet from "helmet";

export const helmetMiddleware = (app: Express): void => {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'trusted-cdn.com'"],
        styleSrc: ["'self'", "'trusted-cdn.com'"],
        imgSrc: ["'self'", "data:", "https:"]
      },
    },
    frameguard: { action: "deny" },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' },
  }));
};
