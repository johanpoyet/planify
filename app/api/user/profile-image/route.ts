import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// POST /api/user/profile-image - Upload une photo de profil
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucune image fournie" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier invalide. Utilisez JPG, PNG, GIF ou WebP." },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Taille maximum : 5MB" },
        { status: 400 }
      );
    }

    // Supprimer l'ancienne image si elle existe
    if (user.profileImageUrl) {
      const oldImagePath = path.join(process.cwd(), "public", user.profileImageUrl);
      if (existsSync(oldImagePath)) {
        try {
          await unlink(oldImagePath);
        } catch (error) {
          console.error("Erreur lors de la suppression de l'ancienne image:", error);
        }
      }
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    const filePath = path.join(process.cwd(), "public", "uploads", "profiles", fileName);

    // Convertir le fichier en buffer et l'écrire
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Mettre à jour l'URL dans la base de données
    // Option 1 (recommandé) : Utiliser Nginx pour servir directement
    const imageUrl = `/uploads/profiles/${fileName}`;
    // Option 2 : Utiliser une API route Next.js
    // const imageUrl = `/api/uploads/profiles/${fileName}`;
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { profileImageUrl: imageUrl },
      select: {
        id: true,
        name: true,
        email: true,
        profileImageUrl: true,
      },
    });

    return NextResponse.json({
      message: "Photo de profil mise à jour",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de la photo:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/profile-image - Supprimer la photo de profil
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Supprimer le fichier physique si il existe
    if (user.profileImageUrl) {
      const imagePath = path.join(process.cwd(), "public", user.profileImageUrl);
      if (existsSync(imagePath)) {
        try {
          await unlink(imagePath);
        } catch (error) {
          console.error("Erreur lors de la suppression du fichier:", error);
        }
      }
    }

    // Mettre à jour la base de données
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { profileImageUrl: null },
      select: {
        id: true,
        name: true,
        email: true,
        profileImageUrl: true,
      },
    });

    return NextResponse.json({
      message: "Photo de profil supprimée",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la photo:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
