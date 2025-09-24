import sharp from "sharp";
import path from "path";
import fs from "fs-extra";
import { storageConfig } from "@/config/storage";

export class ThumbnailService {
  /**
   * Génère un thumbnail pour un fichier
   */
  static async generateThumbnail(
    inputPath: string,
    outputPath: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
    }
  ): Promise<{ success: boolean; thumbnailPath?: string; error?: string }> {
    try {
      const { width, height, quality } = {
        width: options?.width || storageConfig.thumbnail.width,
        height: options?.height || storageConfig.thumbnail.height,
        quality: options?.quality || storageConfig.thumbnail.quality,
      };

      // Vérifier si le fichier d'entrée existe
      if (!(await fs.pathExists(inputPath))) {
        return { success: false, error: "Fichier d'entrée introuvable" };
      }

      // Créer le répertoire de sortie si nécessaire
      await fs.ensureDir(path.dirname(outputPath));

      // Obtenir les métadonnées du fichier
      const metadata = await sharp(inputPath).metadata();

      // Vérifier si c'est une image
      if (!metadata.width || !metadata.height) {
        return {
          success: false,
          error: "Le fichier n'est pas une image valide",
        };
      }

      // Générer le thumbnail
      await sharp(inputPath)
        .resize(width, height, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toFile(outputPath);

      return { success: true, thumbnailPath: outputPath };
    } catch (error) {
      console.error("Erreur lors de la génération du thumbnail:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Génère un thumbnail pour un PDF (première page)
   */
  static async generatePDFThumbnail(
    inputPath: string,
    outputPath: string
  ): Promise<{ success: boolean; thumbnailPath?: string; error?: string }> {
    try {
      // Créer le répertoire de sortie si nécessaire
      await fs.ensureDir(path.dirname(outputPath));

      // Générer le thumbnail de la première page du PDF
      await sharp(inputPath)
        .resize(storageConfig.thumbnail.width, storageConfig.thumbnail.height, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: storageConfig.thumbnail.quality })
        .toFile(outputPath);

      return { success: true, thumbnailPath: outputPath };
    } catch (error) {
      console.error("Erreur lors de la génération du thumbnail PDF:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Génère un thumbnail pour un document Word/Excel
   */
  static async generateDocumentThumbnail(
    inputPath: string,
    outputPath: string
  ): Promise<{ success: boolean; thumbnailPath?: string; error?: string }> {
    try {
      // Créer le répertoire de sortie si nécessaire
      await fs.ensureDir(path.dirname(outputPath));

      // Pour les documents Office, on peut générer un thumbnail simple
      // ou utiliser une icône par défaut
      const defaultThumbnail = await this.generateDefaultThumbnail(outputPath);

      return { success: true, thumbnailPath: defaultThumbnail };
    } catch (error) {
      console.error(
        "Erreur lors de la génération du thumbnail document:",
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Génère un thumbnail par défaut pour les types de fichiers non supportés
   */
  static async generateDefaultThumbnail(outputPath: string): Promise<string> {
    const { width, height } = storageConfig.thumbnail;

    // Créer une image par défaut avec une icône
    await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 240, g: 240, b: 240 },
      },
    })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Génère un thumbnail adapté au type de fichier
   */
  static async generateThumbnailForFile(
    inputPath: string,
    outputPath: string,
    mimeType: string
  ): Promise<{ success: boolean; thumbnailPath?: string; error?: string }> {
    if (mimeType.startsWith("image/")) {
      return await this.generateThumbnail(inputPath, outputPath);
    } else if (mimeType === "application/pdf") {
      return await this.generatePDFThumbnail(inputPath, outputPath);
    } else if (mimeType.includes("document") || mimeType.includes("sheet")) {
      return await this.generateDocumentThumbnail(inputPath, outputPath);
    } else {
      return {
        success: true,
        thumbnailPath: await this.generateDefaultThumbnail(outputPath),
      };
    }
  }

  /**
   * Supprime un thumbnail
   */
  static async deleteThumbnail(thumbnailPath: string): Promise<void> {
    if (await fs.pathExists(thumbnailPath)) {
      await fs.remove(thumbnailPath);
    }
  }

  /**
   * Vérifie si un thumbnail existe
   */
  static async thumbnailExists(thumbnailPath: string): Promise<boolean> {
    return await fs.pathExists(thumbnailPath);
  }
}
