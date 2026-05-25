// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://af49cd78e34e869e5c3fcd47018a17dc@o4508646666141696.ingest.us.sentry.io/4508646670663680",
  integrations: [Sentry.mongoIntegration()],
  // Tracing
//   tracesSampleRate: 1.0, //  Capture 100% of the transactions
});
