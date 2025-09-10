// =====================
// POST /api/products/import/parse
// - Multipart .xlsx upload (field: "file")
// - Parses and returns CreateProductDto[] (no DB writes)
// =====================

import type { NextApiRequest } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";
import formidable, { type File } from "formidable"; // using our shim
import fs from "node:fs/promises";
import { parseExcelBuffer } from "@/services/product_import.service";

// Disable Next.js default body parser to allow formidable stream
export const config = { api: { bodyParser: false, sizeLimit: "10mb" } };

// Parse multipart form (robust filter for excel files)
async function parseForm(req: NextApiRequest): Promise<{ file?: File }> {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
    filter: (part) => {
      const t = part.mimetype || "";
      const name = part.originalFilename || "";
      if (/\.xlsx?$/i.test(name)) return true;
      return /sheet|excel|spreadsheet|officedocument|octet-stream/i.test(t);
    },
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, _fields, files) => {
      if (err) return reject(err);
      const map = files as Record<string, File | File[]>;
      const pick = (v: File | File[] | undefined) => (Array.isArray(v) ? v[0] : v);
      const f = pick(map.file) ?? pick(Object.values(map)[0]);
      resolve({ file: f });
    });
  });
}

async function handler(req: NextApiRequest) {
  if (req.method !== "POST") throw new AppError("Method not allowed", 405);

  const { file } = await parseForm(req);
  if (!file?.filepath) {
    throw new AppError("No file uploaded. Please send field 'file' in multipart/form-data.", 400);
  }

  const buf = await fs.readFile(file.filepath);
  const dtos = parseExcelBuffer(buf); // no DB writes
  return dtos;
}

export default withErrorHandling(handler);
