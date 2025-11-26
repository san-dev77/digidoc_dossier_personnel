import crypto from "crypto";
import { storageConfig } from "@/config/storage";

export class EncryptionService {
  private static readonly ALGORITHM = storageConfig.encryption.algorithm;
  private static readonly KEY_LENGTH = storageConfig.encryption.keyLength;
  private static readonly IV_LENGTH = storageConfig.encryption.ivLength;

  /**
   * Génère une clé de chiffrement
   */
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString("hex");
  }

  /**
   * Génère un vecteur d'initialisation
   */
  static generateIV(): Buffer {
    return crypto.randomBytes(this.IV_LENGTH);
  }

  /**
   * Chiffre un fichier
   */
  static encryptFile(
    fileBuffer: Buffer,
    key: string
  ): {
    encryptedData: Buffer;
    iv: Buffer;
    tag: Buffer;
  } {
    const iv = this.generateIV();
    // Utiliser createCipheriv pour les algorithmes GCM qui supportent setAAD et getAuthTag
    const keyBuffer = Buffer.from(key, "hex").slice(0, 32); // Prendre les 32 premiers bytes pour AES-256
    const cipher = crypto.createCipheriv(
      this.ALGORITHM,
      keyBuffer,
      iv
    ) as crypto.CipherGCM;

    // setAAD et getAuthTag sont disponibles uniquement pour les algorithmes GCM
    if (this.ALGORITHM.includes("gcm")) {
      cipher.setAAD(Buffer.from("file-encryption"));
    }

    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final(),
    ]);

    // getAuthTag est disponible uniquement pour les algorithmes GCM
    const tag = this.ALGORITHM.includes("gcm")
      ? cipher.getAuthTag()
      : Buffer.alloc(0);

    return {
      encryptedData: encrypted,
      iv,
      tag,
    };
  }

  /**
   * Déchiffre un fichier
   */
  static decryptFile(
    encryptedData: Buffer,
    key: string,
    iv: Buffer,
    tag: Buffer
  ): Buffer {
    // Utiliser createDecipheriv pour les algorithmes GCM qui supportent setAAD et setAuthTag
    const keyBuffer = Buffer.from(key, "hex").slice(0, 32); // Prendre les 32 premiers bytes pour AES-256
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      keyBuffer,
      iv
    ) as crypto.DecipherGCM;

    // setAAD et setAuthTag sont disponibles uniquement pour les algorithmes GCM
    if (this.ALGORITHM.includes("gcm")) {
      decipher.setAAD(Buffer.from("file-encryption"));
      decipher.setAuthTag(tag);
    }

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    return decrypted;
  }

  /**
   * Chiffre un fichier et sauvegarde les métadonnées
   */
  static async encryptAndSave(
    fileBuffer: Buffer,
    key: string,
    outputPath: string
  ): Promise<{
    encryptedPath: string;
    metadataPath: string;
    iv: Buffer;
    tag: Buffer;
  }> {
    const { encryptedData, iv, tag } = this.encryptFile(fileBuffer, key);

    // Sauvegarder le fichier chiffré
    const encryptedPath = outputPath + ".enc";
    const fsExtra = await import("fs-extra");
    await fsExtra.writeFile(encryptedPath, encryptedData);

    // Sauvegarder les métadonnées de chiffrement
    const metadataPath = outputPath + ".meta";
    const metadata = {
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      algorithm: this.ALGORITHM,
      timestamp: new Date().toISOString(),
    };

    await fsExtra.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return {
      encryptedPath,
      metadataPath,
      iv,
      tag,
    };
  }

  /**
   * Charge et déchiffre un fichier
   */
  static async loadAndDecrypt(
    encryptedPath: string,
    key: string
  ): Promise<Buffer> {
    const metadataPath = encryptedPath + ".meta";

    // Charger les métadonnées
    const fsExtra = await import("fs-extra");
    const metadata = JSON.parse(await fsExtra.readFile(metadataPath, "utf8"));

    // Charger le fichier chiffré
    const encryptedData = await fsExtra.readFile(encryptedPath);

    // Déchiffrer
    const iv = Buffer.from(metadata.iv, "hex");
    const tag = Buffer.from(metadata.tag, "hex");

    return this.decryptFile(encryptedData, key, iv, tag);
  }

  /**
   * Génère un hash pour vérifier l'intégrité
   */
  static generateHash(data: Buffer): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Vérifie l'intégrité d'un fichier
   */
  static verifyIntegrity(data: Buffer, expectedHash: string): boolean {
    const actualHash = this.generateHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Chiffre les métadonnées sensibles
   */
  static encryptMetadata(
    metadata: Record<string, unknown>,
    key: string
  ): string {
    const cipher = crypto.createCipher("aes-256-cbc", key);
    let encrypted = cipher.update(JSON.stringify(metadata), "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  /**
   * Déchiffre les métadonnées sensibles
   */
  static decryptMetadata(
    encryptedMetadata: string,
    key: string
  ): Record<string, unknown> {
    const decipher = crypto.createDecipher("aes-256-cbc", key);
    let decrypted = decipher.update(encryptedMetadata, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  }
}
