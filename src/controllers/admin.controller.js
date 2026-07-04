import * as articleService from '#services/article.service.js';
import * as debateService from '#services/debate.service.js';
import * as userService from '#services/user.service.js';
import * as statsService from '#services/stats.service.js';
import { handleControllerError } from '#utils/handleError.js';

export async function listArticles(req, res, next) {
    try {
        const result = await articleService.listArticlesForAdmin(req.validated.query);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function approveArticle(req, res, next) {
    try {
        const article = await articleService.approveArticle(req.params.id);
        res.status(200).json({ success: true, data: { article } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function rejectArticle(req, res, next) {
    try {
        const article = await articleService.rejectArticle(req.params.id, req.body.reason);
        res.status(200).json({ success: true, data: { article } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function listDebates(req, res, next) {
    try {
        const result = await debateService.listDebatesForAdmin(req.validated.query);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function approveDebate(req, res, next) {
    try {
        const debate = await debateService.approveDebate(req.params.id);
        res.status(200).json({ success: true, data: { debate } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function rejectDebate(req, res, next) {
    try {
        const debate = await debateService.rejectDebate(req.params.id, req.body.reason);
        res.status(200).json({ success: true, data: { debate } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function getStats(req, res, next) {
    try {
        const stats = await statsService.getAdminStats();
        res.status(200).json({ success: true, data: { stats } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function listUsers(req, res, next) {
    try {
        const result = await userService.listUsersForAdmin(req.validated.query);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function updateUser(req, res, next) {
    try {
        const user = await userService.updateUserAsAdmin(req.params.id, req.body);
        res.status(200).json({ success: true, data: { user } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function deleteUser(req, res, next) {
    try {
        await userService.deleteUserAsAdmin(req.user.id, req.params.id);
        res.status(200).json({ success: true, data: { message: 'Utilizador apagado.' } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}
