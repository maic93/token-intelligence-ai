import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();
const port = Number(process.env.PORT ?? 4000);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'api' });
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
