import { CursorCodec, CursorPayload } from './cursor-codec';

export class CursorPage {
  private readonly _limit: number;
  readonly cursor?: string;

  constructor(limit = 10, cursor?: string) {
    this._limit = limit;
    this.cursor = cursor;
  }

  get limit(): number {
    return this._limit;
  }

  decode(): CursorPayload | null {
    if (!this.cursor) return null;
    return CursorCodec.decode(this.cursor);
  }

  static encodeNext(
    lastRow: Record<string, unknown>,
    orderBy: Record<string, 'asc' | 'desc'>
  ): string {
    return CursorCodec.encode({ values: lastRow, direction: 'next', orderBy });
  }

  static encodePrev(
    firstRow: Record<string, unknown>,
    orderBy: Record<string, 'asc' | 'desc'>
  ): string {
    return CursorCodec.encode({ values: firstRow, direction: 'prev', orderBy });
  }
}