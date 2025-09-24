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
    const cipher = crypto.createCipher(this.ALGORITHM, key);
    cipher.setAAD(Buffer.from("file-encryption"));

    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

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
    const decipher = crypto.createDecipher(this.ALGORITHM, key);
    decipher.setAAD(Buffer.from("file-encryption"));
    decipher.setAuthTag(tag);

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
    await require("fs-extra").writeFile(encryptedPath, encryptedData);

    // Sauvegarder les métadonnées de chiffrement
    const metadataPath = outputPath + ".meta";
    const metadata = {
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      algorithm: this.ALGORITHM,
      timestamp: new Date().toISOString(),
    };

    await require("fs-extra").writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2)
    );

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
    const metadata = JSON.parse(
      await require("fs-extra").readFile(metadataPath, "utf8")
    );

    // Charger le fichier chiffré
    const encryptedData = await require("fs-extra").readFile(encryptedPath);

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
  static encryptMetadata(metadata: any, key: string): string {
    const cipher = crypto.createCipher("aes-256-cbc", key);
    let encrypted = cipher.update(JSON.stringify(metadata), "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  /**
   * Déchiffre les métadonnées sensibles
   */
  static decryptMetadata(encryptedMetadata: string, key: string): any {
    const decipher = crypto.createDecipher("aes-256-cbc", key);
    let decrypted = decipher.update(encryptedMetadata, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  }
}
