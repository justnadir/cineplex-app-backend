import { USER_ROLES } from "../enums";

export interface IAuthUser {
  user_id: number;
  role: USER_ROLES;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

export {};
