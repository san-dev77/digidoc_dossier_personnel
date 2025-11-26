// Fonction pour déterminer le type MIME à partir de l'extension
export const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    webp: "image/webp",
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Vidéos
    mp4: "video/mp4",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    wmv: "video/x-ms-wmv",
    flv: "video/x-flv",
    webm: "video/webm",
    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
    aac: "audio/aac",
    // Texte
    txt: "text/plain",
    md: "text/markdown",
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    csv: "text/csv",
  };

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
};

// Fonction pour convertir un chemin de fichier local en URL API
export const getFileApiUrl = (filePath: string): string => {
  // Si c'est déjà une URL, la retourner telle quelle
  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("/api/")
  ) {
    return filePath;
  }

  // Extraire la partie relative après "uploads"
  const uploadsIndex = filePath.indexOf("uploads");
  if (uploadsIndex !== -1) {
    const relativePath = filePath.substring(
      uploadsIndex + "uploads".length + 1
    );
    // Normaliser les séparateurs de chemin pour Windows/Unix
    const normalizedPath = relativePath.replace(/\\/g, "/");
    return `/api/files/${normalizedPath}`;
  }

  // Si on ne trouve pas "uploads", essayer de trouver le chemin relatif
  // en cherchant le dernier "uploads" dans le chemin
  const lastUploadsIndex = filePath.lastIndexOf("uploads");
  if (lastUploadsIndex !== -1) {
    const relativePath = filePath.substring(
      lastUploadsIndex + "uploads".length + 1
    );
    const normalizedPath = relativePath.replace(/\\/g, "/");
    return `/api/files/${normalizedPath}`;
  }

  // Fallback : retourner le chemin tel quel (peut causer une erreur)
  return filePath;
};

