import * as debateService from '#services/debate.service.js';
import { handleControllerError } from '#utils/handleError.js';

export async function toggleLike(req, res, next) {
    try {
        const result = await debateService.toggleCommentLike(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}
