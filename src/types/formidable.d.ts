// =====================
// Minimal shim for formidable (v2/v3 compatible)
// =====================
declare module "formidable" {
  import type { IncomingMessage } from "http";

  export type File = {
    filepath: string;
    originalFilename?: string | null;
    mimetype?: string | null;
    size: number;
  };

  export type Part = {
    mimetype?: string | null;
    originalFilename?: string | null;
  };

  export type Options = {
    multiples?: boolean;
    keepExtensions?: boolean;
    maxFileSize?: number;
    filter?: (part: Part) => boolean;
  };

  export type FilesMap = Record<string, File | File[]>;

  export interface FormidableInstance {
    parse(
      req: IncomingMessage,
      cb: (err: Error | null, fields: Record<string, string>, files: FilesMap) => void
    ): void;
  }

  const formidable: (opts?: Options) => FormidableInstance;
  export default formidable;
}
