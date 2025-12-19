import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// GET /api/uploads/profiles/[filename] - Servir les images uploadées
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(process.cwd(), "public", "uploads", ...params.path);

    // Vérifier que le fichier existe
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "Fichier introuvable" },
        { status: 404 }
      );
    }

    // Lire le fichier
    const fileBuffer = await readFile(filePath);

    // Déterminer le type MIME
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    // Retourner l'image avec les bons headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
