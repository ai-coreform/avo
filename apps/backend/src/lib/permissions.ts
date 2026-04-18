import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * Custom permission statements
 * Extends the default statements with application-specific resources
 */
const statement = {
  ...defaultStatements,
  // Customer management permissions
  customer: ["create", "read", "update", "delete"],
  customerAddress: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Owner role - Full system access
 * Can perform all actions on all resources
 */
export const owner = ac.newRole({
  ...ownerAc.statements,
  customer: ["create", "read", "update", "delete"],
  customerAddress: ["create", "read", "update", "delete"],
});

/**
 * Production Manager role - Limited access
 * Can only read resources, no administrative capabilities
 */
export const production_manager = ac.newRole({
  ...memberAc.statements,
  customer: ["read"],
  customerAddress: ["read"],
});
