import * as articleService from '#services/article.service.js';
import * as debateService from '#services/debate.service.js';
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
