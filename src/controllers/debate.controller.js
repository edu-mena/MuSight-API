import * as debateService from '#services/debate.service.js';
import { handleControllerError } from '#utils/handleError.js';

export async function listPublic(req, res, next) {
    try {
        const result = await debateService.listPublicDebates(req.validated.query);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function getPublicById(req, res, next) {
    try {
        const debate = await debateService.getPublicDebateById(req.params.id, req.user?.id ?? null);
        res.status(200).json({ success: true, data: { debate } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function listOwn(req, res, next) {
    try {
        const result = await debateService.listOwnDebates(req.user.id, req.validated.query);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function create(req, res, next) {
    try {
        const debate = await debateService.createDebate(req.user.id, req.body);
        res.status(201).json({ success: true, data: { debate } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function remove(req, res, next) {
    try {
        await debateService.deleteDebate(req.user.id, req.params.id);
        res.status(200).json({ success: true, data: { message: 'Debate apagado.' } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function addComment(req, res, next) {
    try {
        const comment = await debateService.commentOnDebate(req.params.id, req.user.id, req.body);
        res.status(201).json({ success: true, data: { comment } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}
