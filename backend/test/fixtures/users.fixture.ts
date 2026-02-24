// Fixtures de usuarios para testes

export interface TestUserData {
  email: string
  password: string
  name: string
  role: 'super-admin' | 'admin' | 'editor' | 'viewer'
}

export const testUsers: Record<string, TestUserData> = {
  superAdmin: {
    email: 'superadmin@test.com',
    password: 'SuperAdmin123!',
    name: 'Super Admin',
    role: 'super-admin'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'admin'
  },
  editor: {
    email: 'editor@test.com',
    password: 'Editor123!',
    name: 'Editor User',
    role: 'editor'
  },
  viewer: {
    email: 'viewer@test.com',
    password: 'Viewer123!',
    name: 'Viewer User',
    role: 'viewer'
  }
}

// Dados invalidos para testes de validacao
export const invalidUsers = {
  noEmail: {
    password: 'Test123!',
    name: 'No Email User',
    role: 'viewer' as const
  },
  noPassword: {
    email: 'nopassword@test.com',
    name: 'No Password User',
    role: 'viewer' as const
  },
  invalidRole: {
    email: 'invalidrole@test.com',
    password: 'Test123!',
    name: 'Invalid Role User',
    role: 'invalid-role' as unknown as 'viewer'
  },
  duplicateEmail: {
    email: 'superadmin@test.com', // Mesmo email do superAdmin
    password: 'Duplicate123!',
    name: 'Duplicate Email User',
    role: 'viewer' as const
  }
}
