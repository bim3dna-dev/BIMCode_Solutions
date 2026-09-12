import { createAuditHandler } from "../../server/audit/handler.js";

// Vercel Node.js Web Standard function. No persistent server framework.
export default { fetch: createAuditHandler() };
