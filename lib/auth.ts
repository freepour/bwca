// Simple authentication for the 4 BWCA friends
export interface User {
  id: string
  username: string
  displayName: string
}

export const USERS: User[] = [
  { id: '1', username: 'deadeye', displayName: 'Deadeye' },
  { id: '2', username: 'shackleton', displayName: 'Shackleton' },
  { id: '3', username: 'whitey', displayName: 'Whitey' },
  { id: '4', username: 'scooter', displayName: 'Scooter' }
]

function getPassword(): string {
  const password = process.env.BWCA_PASSWORD
  if (!password) {
    throw new Error('BWCA_PASSWORD environment variable is required')
  }
  return password
}

export function authenticateUser(username: string, password: string): User | null {
  if (password !== getPassword()) {
    return null
  }

  const user = USERS.find(u => u.username.toLowerCase() === username.toLowerCase())
  return user || null
}

export function getUserById(id: string): User | null {
  return USERS.find(u => u.id === id) || null
}

export function getUserByUsername(username: string): User | null {
  return USERS.find(u => u.username.toLowerCase() === username.toLowerCase()) || null
}
