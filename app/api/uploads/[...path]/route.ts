import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// GET /api/uploads/profiles/[filename] - Servir les images uploadées
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    // Protection contre la traversée de répertoires (OWASP A01/A05) :
    // on rejette tout segment suspect, puis on vérifie que le chemin résolu
    // reste bien confiné dans public/uploads.
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");

    if (pathSegments.some((segment) => segment === ".." || segment.includes("\0"))) {
      return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
    }

    const filePath = path.resolve(uploadsRoot, ...pathSegments);

    if (filePath !== uploadsRoot && !filePath.startsWith(uploadsRoot + path.sep)) {
      return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
    }

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
