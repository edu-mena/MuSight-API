export function parseIdParam(req, res, next) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ success: false, error: 'ID inválido', code: 400 });
    }

    req.params.id = id;
    next();
}
