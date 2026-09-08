export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'INTERNAL';

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  empCode?: string;
  phone?: string;
  hireDate?: string;
}