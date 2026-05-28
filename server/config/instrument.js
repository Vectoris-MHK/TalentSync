// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [Sentry.mongoIntegration()],
  // Tracing
//   tracesSampleRate: 1.0, //  Capture 100% of the transactions
});
