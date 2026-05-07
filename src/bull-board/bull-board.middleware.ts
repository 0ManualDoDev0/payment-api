import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const user = this.config.get('BULL_BOARD_USER', 'admin');
    const pass = this.config.get('BULL_BOARD_PASS', 'admin');

    const authorization = req.headers['authorization'];
    if (!authorization?.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      res.status(401).send('Unauthorized');
      return;
    }

    const base64 = authorization.slice(6);
    const [reqUser, reqPass] = Buffer.from(base64, 'base64').toString().split(':');

    if (reqUser !== user || reqPass !== pass) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      res.status(401).send('Unauthorized');
      return;
    }

    next();
  }
}
