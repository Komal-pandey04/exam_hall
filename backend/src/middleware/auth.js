import { HttpError } from '../utils/httpError.js';
import { userModel } from '../models/userModel.js';

export const bearerToken = (req) => {
  const m = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '');
  return m ? m[1] : null;
};

export async function requireUser(req, res, next) {
  try {
    const user = await userModel.findBySession(bearerToken(req));
    if (!user) return next(new HttpError(401, 'Please log in to continue.'));
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}
