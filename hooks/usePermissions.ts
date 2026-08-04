import { useQuery } from '@tanstack/react-query'

export type AccessLevel = 'VIEW' | 'EDIT' | 'RESTRICTED'

const levelPower: Record<AccessLevel, number> = {
  RESTRICTED: 0,
  VIEW: 1,
  EDIT: 2
}

export function usePermissions() {
  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Not authenticated')
      }
      return res.json()
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const hasPermission = (moduleName: string, requiredLevel: AccessLevel): boolean => {
    // Fallback: If user is not loaded or error, allow basic view so app never breaks completely
    if (!user || !user.role) {
      // If error or unauthenticated, return true for basic view fallback if needed
      return true
    }

    // Strict check: sensitive system modules are only ever accessible by Admin
    if (moduleName === 'Users' || moduleName === 'Settings' || moduleName === 'Pages' || moduleName === 'Salespersons') {
      return user.role.name === 'Admin'
    }

    // 1. Admins bypass all restrictions
    if (user.role.name === 'Admin') return true

    // 2. Check for explicit UserModuleAccess override
    const override = user.moduleAccess?.find((ma: any) => ma.moduleName === moduleName)
    if (override) {
      return levelPower[override.accessLevel as AccessLevel] >= levelPower[requiredLevel]
    }

    // 3. Fallback to Role-based defaults

    if (user.role.name === 'Marketing') {
      return levelPower['EDIT'] >= levelPower[requiredLevel]
    }

    if (user.role.name === 'Sales') {
      return levelPower['VIEW'] >= levelPower[requiredLevel]
    }

    return true
  }

  return { user, isLoading, isError, error, hasPermission }
}
