export function toSafeUser(user) {
    const { passwordHash, googleId, ...safeUser } = user;
    return safeUser;
}
