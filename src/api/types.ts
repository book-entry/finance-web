export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: unknown;
  timestamp: string;
  traceId?: string;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
  timestamp: string;
  traceId?: string;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(args: {
    code: string;
    message: string;
    status: number;
    fieldErrors?: Record<string, string>;
  }) {
    super(args.message);
    this.name = 'ApiError';
    this.code = args.code;
    this.status = args.status;
    this.fieldErrors = args.fieldErrors;
  }
}
