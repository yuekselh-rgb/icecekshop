import { prisma } from "@/lib/prisma";

type LogAuditEventParams = {
  tenantId: string;
  actorUserId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/*
 * Protokolliert eine sicherheitsrelevante Admin-Aktion für die
 * Platform-Owner-Aktivitätsansicht. Darf eine echte Änderung nie
 * blockieren — Fehler werden nur geloggt, niemals weitergeworfen.
 */
export async function logAuditEvent(params: LogAuditEventParams) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        actorUserId: params.actorUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: params.action,
        summary: params.summary,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata,
      },
    });
  } catch (error) {
    console.error("AUDIT_LOG_ERROR", error);
  }
}

type LogLoginEventParams = {
  tenantId: string | null;
  userId: string;
  email: string;
  role: string;
};

/*
 * Protokolliert einen erfolgreichen Login. Darf den eigentlichen
 * Login-Vorgang nie blockieren — Fehler werden nur geloggt.
 */
export async function logLoginEvent(params: LogLoginEventParams) {
  try {
    await prisma.loginEvent.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        email: params.email,
        role: params.role,
      },
    });
  } catch (error) {
    console.error("LOGIN_EVENT_LOG_ERROR", error);
  }
}
