import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não está definido nas variáveis de ambiente');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

if (!JWT_EXPIRES_IN) {
    throw new Error('JWT_EXPIRES_IN não está definida no .env');
}
export function signToken(payload, expiresIn = JWT_EXPIRES_IN) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn, algorithm: 'HS256' });
}

export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}
