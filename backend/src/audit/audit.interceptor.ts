import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service.js';
import { AuditAction } from './audit-log.entity.js';

const METHOD_TO_ACTION: Record<string, AuditAction> = {
  GET: AuditAction.READ,
  POST: AuditAction.CREATE,
  PATCH: AuditAction.UPDATE,
  PUT: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

const SENSITIVE_FIELDS = ['password', 'token', 'refreshToken', 'signatureToken', 'integrationApiKey'];

function sanitize(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const clean = { ...data as Record<string, unknown> };
  for (const field of SENSITIVE_FIELDS) {
    if (field in clean) clean[field] = '***';
  }
  return clean;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const user = req.user;
    const start = Date.now();

    // Extract resource from URL path
    const pathParts = url.split('/').filter(Boolean);
    const resource = pathParts.find((p: string) =>
      !p.match(/^[0-9a-f]{8}-/) && p !== 'api' && p !== 'v1',
    ) ?? url;

    // Extract pregnancy/patient IDs from params
    const pregnancyId = req.params?.pregnancyId ?? null;
    const patientId = req.params?.patientId ?? null;

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          this.auditService.log({
            userId: user?.userId ?? null,
            patientId,
            pregnancyId,
            action: METHOD_TO_ACTION[method] ?? AuditAction.READ,
            resource,
            resourceId: req.params?.id ?? null,
            ipAddress: req.ip ?? req.socket?.remoteAddress ?? 'unknown',
            userAgent: req.headers?.['user-agent'] ?? null,
            requestData: method !== 'GET' ? sanitize(req.body) : null,
            responseStatus: res.statusCode,
            tenantId: user?.tenantId ?? null,
          }).catch(() => {});
        },
        error: (err) => {
          this.auditService.log({
            userId: user?.userId ?? null,
            patientId,
            pregnancyId,
            action: METHOD_TO_ACTION[method] ?? AuditAction.READ,
            resource,
            resourceId: req.params?.id ?? null,
            ipAddress: req.ip ?? req.socket?.remoteAddress ?? 'unknown',
            userAgent: req.headers?.['user-agent'] ?? null,
            requestData: method !== 'GET' ? sanitize(req.body) : null,
            responseStatus: err.status ?? 500,
            tenantId: user?.tenantId ?? null,
          }).catch(() => {});
        },
      }),
    );
  }
}
