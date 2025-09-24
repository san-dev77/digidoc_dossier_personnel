import { storageConfig } from "@/config/storage";
import { FileManager } from "@/services/storage/FileManager";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class FileValidator {
  /**
   * Valide un fichier uploadé
   */
  static validateFile(file: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation du nom de fichier
    if (!file.originalname || file.originalname.trim() === "") {
      errors.push("Le nom du fichier est requis");
    }

    // Validation de la taille
    if (!FileManager.validateFileSize(file.size)) {
      errors.push(
        `La taille du fichier (${this.formatFileSize(
          file.size
        )}) dépasse la limite autorisée (${this.formatFileSize(
          storageConfig.maxFileSize
        )})`
      );
    }

    // Validation du type MIME
    if (!FileManager.validateFileType(file.mimetype, file.originalname)) {
      errors.push(`Type de fichier non autorisé: ${file.mimetype}`);
    }

    // Validation du contenu du fichier
    if (file.buffer.length === 0) {
      errors.push("Le fichier est vide");
    }

    // Vérifications de sécurité
    if (this.containsSuspiciousContent(file.originalname)) {
      warnings.push("Le nom du fichier contient des caractères suspects");
    }

    // Vérification de l'extension
    if (!this.hasValidExtension(file.originalname)) {
      errors.push("Extension de fichier non autorisée");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valide les métadonnées d'une pièce
   */
  static validatePieceMetadata(metadata: {
    nom: string;
    description?: string;
    rubriqueId: string;
    sousDossierId: string;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation du nom
    if (!metadata.nom || metadata.nom.trim() === "") {
      errors.push("Le nom de la pièce est requis");
    } else if (metadata.nom.length > 255) {
      errors.push("Le nom de la pièce ne peut pas dépasser 255 caractères");
    }

    // Validation de la description
    if (metadata.description && metadata.description.length > 1000) {
      warnings.push("La description est très longue (plus de 1000 caractères)");
    }

    // Validation des IDs (plus flexible - accepte UUIDs, nombres, ou chaînes non vides)
    if (!metadata.rubriqueId || metadata.rubriqueId.trim() === "") {
      errors.push("ID de rubrique requis");
    }

    if (!metadata.sousDossierId || metadata.sousDossierId.trim() === "") {
      errors.push("ID de sous-dossier requis");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valide un ensemble de fichiers
   */
  static validateMultipleFiles(files: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier le nombre de fichiers
    if (files.length > storageConfig.maxFiles) {
      errors.push(
        `Trop de fichiers (${files.length}). Maximum autorisé: ${storageConfig.maxFiles}`
      );
    }

    // Valider chaque fichier
    files.forEach((file, index) => {
      const result = this.validateFile(file);
      if (!result.isValid) {
        errors.push(`Fichier ${index + 1}: ${result.errors.join(", ")}`);
      }
      warnings.push(
        ...result.warnings.map((w) => `Fichier ${index + 1}: ${w}`)
      );
    });

    // Vérifier les doublons
    const fileNames = files.map((f) => f.originalname.toLowerCase());
    const duplicates = fileNames.filter(
      (name, index) => fileNames.indexOf(name) !== index
    );
    if (duplicates.length > 0) {
      warnings.push(`Fichiers en double détectés: ${duplicates.join(", ")}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Vérifie si le contenu est suspect
   */
  private static containsSuspiciousContent(filename: string): boolean {
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.pif$/i,
      /\.com$/i,
      /\.js$/i,
      /\.vbs$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(filename));
  }

  /**
   * Vérifie si l'extension est valide
   */
  private static hasValidExtension(filename: string): boolean {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
    return storageConfig.allowedExtensions.includes(ext);
  }

  /**
   * Vérifie si une chaîne est un UUID valide
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Formate la taille d'un fichier
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Valide les permissions d'accès
   */
  static validateAccess(
    userId: string,
    rubriqueId: string,
    sousDossierId: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // TODO: Implémenter la logique de validation des permissions
    // Pour l'instant, on accepte tout
    if (!userId) {
      errors.push("Utilisateur non authentifié");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
