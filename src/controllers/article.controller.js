import * as articleService from '#services/article.service.js';
import { handleControllerError } from '#utils/handleError.js';

export async function listPublic(req, res, next) {
    try {
        const result = await articleService.listPublicArticles(req.validated.query);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function getPublicById(req, res, next) {
    try {
        const article = await articleService.getPublicArticleById(req.params.id);
        res.status(200).json({ success: true, data: { article } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function listOwn(req, res, next) {
    try {
        const result = await articleService.listOwnArticles(req.user.id, req.validated.query);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function create(req, res, next) {
    try {
        const article = await articleService.createArticle(req.user.id, req.body, req.files);
        res.status(201).json({ success: true, data: { article } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function update(req, res, next) {
    try {
        const article = await articleService.updateArticle(
            req.user.id,
            req.params.id,
            req.body,
            req.files
        );
        res.status(200).json({ success: true, data: { article } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function remove(req, res, next) {
    try {
        await articleService.deleteArticle(req.user.id, req.params.id);
        res.status(200).json({ success: true, data: { message: 'Artigo apagado.' } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}
