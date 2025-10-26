// Mock auth functions for now - replace with actual auth implementation
export async function getCurrentUser() {
  // TODO: Implement actual auth
  return {
    id: 'user_1',
    tenantId: 'tenant_1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN' as const,
  }
}

export async function getTenantId() {
  const user = await getCurrentUser()
  return user.tenantId
}

export async function requireRole(role: 'ADMIN' | 'TEACHER' | 'STUDENT') {
  const user = await getCurrentUser()
  if (user.role !== role && user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }
  return user
}

