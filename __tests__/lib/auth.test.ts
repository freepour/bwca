import { authenticateUser, getUserById, getUserByUsername, USERS } from '@/lib/auth'

describe('Auth utilities', () => {
  describe('authenticateUser', () => {
    it('authenticates user with correct password and username', () => {
      const user = authenticateUser('deadeye', process.env.BWCA_PASSWORD!)
      expect(user).toBeTruthy()
      expect(user?.username).toBe('deadeye')
      expect(user?.displayName).toBe('Deadeye')
    })

    it('is case insensitive for username', () => {
      const user = authenticateUser('DEADEYE', process.env.BWCA_PASSWORD!)
      expect(user).toBeTruthy()
      expect(user?.username).toBe('deadeye')
    })

    it('returns null for incorrect password', () => {
      const user = authenticateUser('deadeye', 'wrongpassword')
      expect(user).toBeNull()
    })

    it('returns null for non-existent user', () => {
      const user = authenticateUser('nonexistent', process.env.BWCA_PASSWORD!)
      expect(user).toBeNull()
    })

    it('authenticates all valid users', () => {
      const password = process.env.BWCA_PASSWORD!
      const usernames = ['deadeye', 'shackleton', 'whitey', 'scooter']

      usernames.forEach(username => {
        const user = authenticateUser(username, password)
        expect(user).toBeTruthy()
        expect(user?.username).toBe(username)
      })
    })
  })

  describe('getUserById', () => {
    it('returns user by id', () => {
      const user = getUserById('1')
      expect(user).toBeTruthy()
      expect(user?.username).toBe('deadeye')
    })

    it('returns null for non-existent id', () => {
      const user = getUserById('999')
      expect(user).toBeNull()
    })

    it('returns correct user for all valid ids', () => {
      const expectedUsers = [
        { id: '1', username: 'deadeye' },
        { id: '2', username: 'shackleton' },
        { id: '3', username: 'whitey' },
        { id: '4', username: 'scooter' },
      ]

      expectedUsers.forEach(expected => {
        const user = getUserById(expected.id)
        expect(user?.username).toBe(expected.username)
      })
    })
  })

  describe('getUserByUsername', () => {
    it('returns user by username', () => {
      const user = getUserByUsername('deadeye')
      expect(user).toBeTruthy()
      expect(user?.id).toBe('1')
    })

    it('is case insensitive', () => {
      const user = getUserByUsername('SHACKLETON')
      expect(user).toBeTruthy()
      expect(user?.username).toBe('shackleton')
    })

    it('returns null for non-existent username', () => {
      const user = getUserByUsername('nonexistent')
      expect(user).toBeNull()
    })

    it('returns correct user for all valid usernames', () => {
      const usernames = ['deadeye', 'shackleton', 'whitey', 'scooter']

      usernames.forEach((username, index) => {
        const user = getUserByUsername(username)
        expect(user?.id).toBe(String(index + 1))
      })
    })
  })

  describe('USERS constant', () => {
    it('contains 4 users', () => {
      expect(USERS).toHaveLength(4)
    })

    it('has unique ids', () => {
      const ids = USERS.map(u => u.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(USERS.length)
    })

    it('has unique usernames', () => {
      const usernames = USERS.map(u => u.username)
      const uniqueUsernames = new Set(usernames)
      expect(uniqueUsernames.size).toBe(USERS.length)
    })
  })
})
