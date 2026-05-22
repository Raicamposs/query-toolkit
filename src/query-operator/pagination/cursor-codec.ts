export interface CursorPayload {
  values: Record<string, unknown>;
  direction: 'next' | 'prev';
  orderBy: Record<string, 'asc' | 'desc'>;
}

export class CursorCodec {
  static encode(payload: CursorPayload): string {
    const json = JSON.stringify(payload);
    return Buffer.from(json, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  static decode(cursor: string): CursorPayload | null {
    try {
      const base64 = cursor.replace(/-/g, '+').replace(/_/g, '/');
      const json = Buffer.from(base64, 'base64').toString('utf-8');
      return JSON.parse(json) as CursorPayload;
    } catch {
      return null;
    }
  }
}