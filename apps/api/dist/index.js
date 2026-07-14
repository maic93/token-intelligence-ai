import express from 'express';
const app = express();
const port = Number(process.env.PORT ?? 4000);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api' });
});
app.listen(port, () => {
    console.log(`API listening on port ${port}`);
});
//# sourceMappingURL=index.js.map