export function validate(schema, source = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const message = result.error.issues.map((issue) => issue.message).join(', ');
            return res.status(422).json({ success: false, error: message, code: 422 });
        }

        if (source === 'body') {
            req.body = result.data;
        } else {
            req.validated = req.validated || {};
            req.validated[source] = result.data;
        }

        next();
    };
}
