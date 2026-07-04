import * as userService from '#services/user.service.js';
import { handleControllerError } from '#utils/handleError.js';

export async function updateProfile(req, res, next) {
    try {
        const user = await userService.updateProfile(req.user.id, req.body);
        res.status(200).json({ success: true, data: { user } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}

export async function applyResearcher(req, res, next) {
    try {
        const user = await userService.applyResearcher(req.user, req.body);
        res.status(200).json({ success: true, data: { user, message: 'Candidatura enviada.' } });
    } catch (err) {
        handleControllerError(err, res, next);
    }
}
