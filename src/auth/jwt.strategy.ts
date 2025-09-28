import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          const token = req?.cookies?.access_token;
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret, // Use your actual secret
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
