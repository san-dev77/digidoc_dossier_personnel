import path from "path";

export const storageConfig = {
  // Répertoires de base
  baseDir: path.join(process.cwd(), "uploads"),
  tempDir: path.join(process.cwd(), "uploads", "temp"),
  documentsDir: path.join(process.cwd(), "uploads", "documents"),

  // Limites de fichiers
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,

  // Types de fichiers autorisés
  allowedMimeTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ],

  // Extensions autorisées
  allowedExtensions: [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".txt",
    ".csv",
  ],

  // Configuration des thumbnails
  thumbnail: {
    width: 200,
    height: 200,
    quality: 80,
    format: "jpeg" as const,
  },

  // Configuration du chiffrement
  encryption: {
    algorithm: "aes-256-gcm",
    keyLength: 32,
    ivLength: 16,
  },
};

export const getStoragePath = (
  rubriqueId: string,
  sousDossierId: string,
  pieceId: string
) => {
  return path.join(
    storageConfig.documentsDir,
    "rubriques",
    rubriqueId,
    "sous-dossiers",
    sousDossierId,
    "pieces",
    pieceId
  );
};

export const getTempPath = (sessionId: string) => {
  return path.join(storageConfig.tempDir, sessionId);
};
