import { User } from '@prisma/client'

export enum AccessLevel {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  RESTRICTED = 'RESTRICTED'
}

const levelPower = {
  [AccessLevel.RESTRICTED]: 0,
  [AccessLevel.VIEW]: 1,
  [AccessLevel.EDIT]: 2
}

/**
 * Checks if a user has at least the required access level for a specific module.
 * Admins always have EDIT access.
 * Marketing Team has EDIT access to everything except Users and Settings.
 * Sales Team has VIEW access to everything except Users and Settings.
 */
export function checkPermission(
  user: any, // expecting User with role and moduleAccess relations
  moduleName: string,
  requiredLevel: AccessLevel,
  isDelete: boolean = false
): boolean {
  if (!user || !user.role) return false

  // Sales users are explicitly forbidden from deleting any records
  if (isDelete && user.role.name === 'Sales') {
    return false
  }

  // If checking Units, fallback to Projects permissions
  if (moduleName === 'Units') {
    return checkPermission(user, 'Projects', requiredLevel, isDelete)
  }

  // 1. Admins bypass all restrictions
  if (user.role.name === 'Admin') return true

  // 2. Check for explicit UserModuleAccess override
  const override = user.moduleAccess?.find((ma: any) => ma.moduleName === moduleName)
  if (override) {
    return levelPower[override.accessLevel as AccessLevel] >= levelPower[requiredLevel]
  }

  // 3. Fallback to Role-based defaults
  if (
    moduleName === 'Users' ||
    moduleName === 'Settings' ||
    moduleName === 'Salespersons' ||
    moduleName === 'Analytics' ||
    moduleName === 'Templates' ||
    moduleName === 'Pages'
  ) {
    // Only Admin can access these core modules unless explicitly overridden
    return false
  }

  if (user.role.name === 'Marketing') {
    // Marketing can Edit other modules
    return levelPower[AccessLevel.EDIT] >= levelPower[requiredLevel]
  }

  if (user.role.name === 'Sales') {
    // Sales can only View other modules by default
    return levelPower[AccessLevel.VIEW] >= levelPower[requiredLevel]
  }

  return false
}
