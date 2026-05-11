declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      fullName: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
