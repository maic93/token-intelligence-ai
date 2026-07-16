import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

const REQUEST_ID_HEADER = 'X-Request-Id';

export interface RequestWithId extends Request {
  requestId: string;
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const id = (req.headers[REQUEST_ID_HEADER.toLowerCase()] as string | undefined) ?? randomUUID();
  (req as RequestWithId).requestId = id;
  _res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
