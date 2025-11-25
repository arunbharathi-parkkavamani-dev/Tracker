import { getRegistry } from "./registry/index.js";

const fn = getRegistry(rule.registry);
if (fn) {
  const result = await fn({ user, modelName, doc, fields, filter, context });
  // registry returns decision (true / false) or override object
}
