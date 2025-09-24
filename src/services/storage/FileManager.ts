import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import { storageConfig, getStoragePath, getTempPath } from "@/config/storage";

export class FileManager {
  /**
   * Crée la structure de répertoires pour une pièce
   */
  static async createPieceDirectories(
    rubriqueId: string,
    sousDossierId: string,
    pieceId: string
  ): Promise<string> {
    const basePath = getStoragePath(rubriqueId, sousDossierId, pieceId);

    const directories = [
      path.join(basePath, "original"),
      path.join(basePath, "thumbnails"),
      path.join(basePath, "metadata"),
      path.join(basePath, "versions"),
      path.join(basePath, "temp"),
    ];

    for (const dir of directories) {
      await fs.ensureDir(dir);
    }

    return basePath;
  }

  /**
   * Génère un nom de fichier sécurisé avec hash
   */
  static generateSecureFileName(originalName: string, pieceId: string): string {
    const ext = path.extname(originalName);
    const hash = crypto
      .createHash("sha256")
      .update(originalName + pieceId + Date.now())
      .digest("hex")
      .substring(0, 16);

    return `${hash}${ext}`;
  }

  /**
   * Valide le type de fichier
   */
  static validateFileType(mimeType: string, originalName: string): boolean {
    const ext = path.extname(originalName).toLowerCase();

    return (
      storageConfig.allowedMimeTypes.includes(mimeType) &&
      storageConfig.allowedExtensions.includes(ext)
    );
  }

  /**
   * Valide la taille du fichier
   */
  static validateFileSize(size: number): boolean {
    return size <= storageConfig.maxFileSize;
  }

  /**
   * Sauvegarde un fichier dans le répertoire approprié
   */
  static async saveFile(
    fileBuffer: Buffer,
    rubriqueId: string,
    sousDossierId: string,
    pieceId: string,
    originalName: string
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    // Créer les répertoires
    const basePath = await this.createPieceDirectories(
      rubriqueId,
      sousDossierId,
      pieceId
    );

    // Générer un nom de fichier sécurisé
    const fileName = this.generateSecureFileName(originalName, pieceId);
    const filePath = path.join(basePath, "original", fileName);

    // Sauvegarder le fichier
    await fs.writeFile(filePath, fileBuffer);

    return {
      filePath,
      fileName,
      fileSize: fileBuffer.length,
    };
  }

  /**
   * Lit un fichier depuis le stockage
   */
  static async readFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
  }

  /**
   * Supprime un fichier et ses métadonnées
   */
  static async deleteFile(
    rubriqueId: string,
    sousDossierId: string,
    pieceId: string
  ): Promise<void> {
    const basePath = getStoragePath(rubriqueId, sousDossierId, pieceId);

    if (await fs.pathExists(basePath)) {
      await fs.remove(basePath);
    }
  }

  /**
   * Déplace un fichier vers l'archive
   */
  static async archiveFile(
    rubriqueId: string,
    sousDossierId: string,
    pieceId: string
  ): Promise<void> {
    const basePath = getStoragePath(rubriqueId, sousDossierId, pieceId);
    const archivePath = path.join(
      storageConfig.documentsDir,
      "rubriques",
      rubriqueId,
      "sous-dossiers",
      sousDossierId,
      "archive",
      `deleted_${Date.now()}`
    );

    if (await fs.pathExists(basePath)) {
      await fs.move(basePath, archivePath);
    }
  }

  /**
   * Nettoie les fichiers temporaires
   */
  static async cleanupTempFiles(): Promise<void> {
    const tempDir = storageConfig.tempDir;

    if (await fs.pathExists(tempDir)) {
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
        }
      }
    }
  }

  /**
   * Obtient les informations d'un fichier
   */
  static async getFileInfo(filePath: string): Promise<{
    size: number;
    mtime: Date;
    exists: boolean;
  }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime,
        exists: true,
      };
    } catch {
      return {
        size: 0,
        mtime: new Date(),
        exists: false,
      };
    }
  }

  /**
   * Crée un répertoire temporaire pour une session
   */
  static async createTempDirectory(sessionId: string): Promise<string> {
    const tempPath = getTempPath(sessionId);
    await fs.ensureDir(tempPath);
    return tempPath;
  }

  /**
   * Supprime un répertoire temporaire
   */
  static async removeTempDirectory(sessionId: string): Promise<void> {
    const tempPath = getTempPath(sessionId);
    if (await fs.pathExists(tempPath)) {
      await fs.remove(tempPath);
    }
  }
}
