export function toSafeUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}
