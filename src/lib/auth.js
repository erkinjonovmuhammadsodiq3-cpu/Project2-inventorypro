const ITERATIONS = 150000

const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))

const fromBase64 = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0))

export async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256)
  return { salt: toBase64(salt), passwordHash: toBase64(bits) }
}

export async function verifyPassword(password, account) {
  const result = await hashPassword(password, fromBase64(account.salt))
  const actual = fromBase64(result.passwordHash)
  const expected = fromBase64(account.passwordHash)
  return actual.length === expected.length && actual.every((value, index) => value === expected[index])
}

export const getPasswordStrength = (password) => {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
    password.length >= 12,
  ]
  const score = checks.filter(Boolean).length
  const label = score < 2 ? 'Zaif' : score < 4 ? 'O‘rtacha' : 'Kuchli'
  return { score, label, checks }
}
