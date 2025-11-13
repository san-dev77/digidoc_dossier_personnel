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

// Fonction pour remplacer les caractères spéciaux de manière lisible
const cleanForPath = (str: string): string => {
  return str
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ýÿ]/g, "y")
    .replace(/[ç]/g, "c")
    .replace(/[ñ]/g, "n")
    .replace(/[ÀÁÂÃÄÅ]/g, "A")
    .replace(/[ÈÉÊË]/g, "E")
    .replace(/[ÌÍÎÏ]/g, "I")
    .replace(/[ÒÓÔÕÖ]/g, "O")
    .replace(/[ÙÚÛÜ]/g, "U")
    .replace(/[ÝŸ]/g, "Y")
    .replace(/[Ç]/g, "C")
    .replace(/[Ñ]/g, "N")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, ""); // Enlever les _ au début et fin
};

// Nouvelle fonction avec noms lisibles mais raccourcis
export const getReadableStoragePath = (
  rubriqueNom: string,
  sousDossierTitre: string,
  pieceNom: string,
  agentNom: string
) => {
  // Nettoyer et tronquer les noms (max 20 caractères chacun)
  const truncate = (str: string, maxLen: number = 20) => {
    const cleaned = cleanForPath(str);
    return cleaned.length > maxLen ? cleaned.substring(0, maxLen) : cleaned;
  };

  const shortRubrique = truncate(rubriqueNom, 15);
  const shortSousDossier = truncate(sousDossierTitre, 15);
  const shortPiece = truncate(pieceNom, 15);
  const shortAgent = truncate(agentNom, 15);

  return path.join(
    storageConfig.baseDir,
    shortRubrique,
    shortSousDossier,
    shortPiece,
    shortAgent
  );
};

export const getTempPath = (sessionId: string) => {
  return path.join(storageConfig.tempDir, sessionId);
};

// Fonction pour générer un nom de fichier avec le nom de l'agent (raccourci)
export const generateAgentFileName = (
  originalName: string,
  agentNom: string
): string => {
  const cleanAgent = cleanForPath(agentNom).substring(0, 10); // Max 10 chars
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);

  // Nettoyer et limiter le nom de base (max 30 caractères)
  const cleanBaseName = cleanForPath(baseName).substring(0, 30);

  // Timestamp pour unicité
  const timestamp = Date.now().toString().slice(-6);

  return `${cleanAgent}_${timestamp}_${cleanBaseName}${extension}`;
};
