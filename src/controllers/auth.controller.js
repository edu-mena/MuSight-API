import * as authService from '#services/auth.service.js';
import { decodeToken } from '#config/jwt.js';
import { handleControllerError } from '#utils/handleError.js';

const isProduction = process.env.NODE_ENV === 'production';

function cookieOptions(token) {
    const decoded = decodeToken(token);
    const maxAge = decoded.exp * 1000 - Date.now();

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge,
    };
}

export async function register(req, res, next) {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({
            success: true,
            data: { user, message: 'Conta criada. Verifica o teu email para confirmar.' },
        });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function confirmEmail(req, res, next) {
    try {
        const user = await authService.confirmEmail(req.params.token);
        res.status(200).json({
            success: true,
            data: { user, message: 'Email confirmado com sucesso.' },
        });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function login(req, res, next) {
    try {
        const { token, user } = await authService.login(req.body);
        res.cookie('token', token, cookieOptions(token));
        res.status(200).json({ success: true, data: { token, user } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function logout(req, res, next) {
    try {
        res.clearCookie('token');
        res.status(200).json({ success: true, data: { message: 'Sessão terminada.' } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function resendConfirmation(req, res, next) {
    try {
        await authService.resendConfirmation(req.body);
        res.status(200).json({
            success: true,
            data: {
                message:
                    'Se existir uma conta por confirmar com esse email, foi enviado um novo link.',
            },
        });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function me(req, res, next) {
    try {
        const user = await authService.getUserById(req.user.id);
        res.status(200).json({ success: true, data: { user } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function forgotPassword(req, res, next) {
    try {
        await authService.forgotPassword(req.body);
        res.status(200).json({
            success: true,
            data: {
                message:
                    'Se existir uma conta com esse email, foi enviado um link de reposição de password.',
            },
        });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function resetPassword(req, res, next) {
    try {
        await authService.resetPassword(req.body);
        res.status(200).json({ success: true, data: { message: 'Password reposta com sucesso.' } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}
