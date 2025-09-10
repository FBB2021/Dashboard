// =====================
// POST /api/products/import
// =====================

import type { NextApiRequest, NextApiResponse } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";
import formidable, { type File } from "formidable"; // using our shim
import fs from "node:fs/promises";
import { importProductsFromExcel } from "@/services/product_import.service";

// Disable Next.js body parser to allow formidable to handle the stream
export const config = {
  api: { bodyParser: false, sizeLimit: "10mb" },
};

// ---------- Helper: parse multipart form ----------
async function parseForm(req: NextApiRequest): Promise<{ file?: File }> {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    // Robust filter: allow various excel mimes and fallback by filename
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

      // Try to get 'file' field first; otherwise first file in map
      let f: File | undefined;
      const direct = files as Record<string, File | File[]>;
      if (direct.file) {
        f = Array.isArray(direct.file) ? direct.file[0] : (direct.file as File);
      } else {
        const any = Object.values(direct)[0];
        f = Array.isArray(any) ? any[0] : (any as File | undefined);
      }
      resolve({ file: f });
    });
  });
}

// ---------- Controller ----------
async function handler(req: NextApiRequest, _res: NextApiResponse) {
  if (req.method !== "POST") throw new AppError("Method not allowed", 405);

  const { file } = await parseForm(req);
  if (!file?.filepath) {
    throw new AppError("No file uploaded. Please send field 'file' in multipart/form-data.", 400);
  }

  const buf = await fs.readFile(file.filepath);
  const summary = await importProductsFromExcel(buf);
  return summary;
}

export default withErrorHandling(handler);
