// =====================
// Minimal shim for formidable (v2/v3 compatible)
// =====================
declare module "formidable" {
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
    parse(req: any, cb: (err: any, fields: any, files: FilesMap) => void): void;
  }

  const formidable: (opts?: Options) => FormidableInstance;
  export default formidable;
}
