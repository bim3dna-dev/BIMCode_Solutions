import { createAuditHandler } from "../../server/audit/handler.js";

export default { fetch: createAuditHandler({ operation: "interview" }) };
