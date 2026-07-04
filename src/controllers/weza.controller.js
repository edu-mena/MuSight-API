import * as wezaService from '#services/weza.service.js';
import { handleControllerError } from '#utils/handleError.js';

export async function ask(req, res, next) {
    try {
        const result = await wezaService.askWeza(req.user.id, req.body.question);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}
