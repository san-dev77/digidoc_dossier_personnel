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

// Nouvelle fonction avec noms lisibles
export const getReadableStoragePath = (
  rubriqueNom: string,
  sousDossierTitre: string,
  pieceNom: string,
  agentNom: string
) => {
  // Nettoyer les noms pour les utiliser dans les chemins de fichiers
  const cleanRubrique = cleanForPath(rubriqueNom);
  const cleanSousDossier = cleanForPath(sousDossierTitre);
  const cleanPiece = cleanForPath(pieceNom);
  const cleanAgent = cleanForPath(agentNom);

  return path.join(
    storageConfig.baseDir,
    cleanRubrique,
    cleanSousDossier,
    cleanPiece,
    cleanAgent
  );
};

export const getTempPath = (sessionId: string) => {
  return path.join(storageConfig.tempDir, sessionId);
};

// Fonction pour générer un nom de fichier avec le nom de l'agent
export const generateAgentFileName = (
  originalName: string,
  agentNom: string
): string => {
  const cleanAgent = cleanForPath(agentNom);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);

  // Nettoyer le nom de base pour éviter les caractères problématiques
  const cleanBaseName = cleanForPath(baseName);

  return `${cleanAgent}_${cleanBaseName}${extension}`;
};
