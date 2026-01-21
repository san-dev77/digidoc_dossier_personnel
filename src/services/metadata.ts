import { PrismaClient } from "@prisma/client";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

const prisma = new PrismaClient();

export interface MetadataCreate {
  sous_dossier_id: number;
  nom_meta: string;
  type_meta: string;
}

export interface MetadataUpdate {
  nom_meta?: string;
  type_meta?: string;
}

export interface MetadataResponse {
  success: boolean;
  message: string;
  data?: unknown | null;
}

export class MetadataService {
  /**
   * Crée une nouvelle métadonnée (côté serveur - pour API routes)
   */
  static async createMetadataServer(
    metadataData: MetadataCreate
  ): Promise<MetadataResponse> {
    try {
      const metadata = await prisma.metadata_credit.create({
        data: {
          sous_dossier_id: metadataData.sous_dossier_id,
          nom_meta: metadataData.nom_meta,
          type_meta: metadataData.type_meta,
        },
        include: {
          sous_dossiers: true,
        },
      });

      return {
        success: true,
        message: "Métadonnée créée avec succès",
        data: metadata,
      };
    } catch (error: unknown) {
      console.error(
        "Erreur détaillée lors de la création de métadonnée:",
        error
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la création: ${errorMessage}`,
        data: null,
      };
    }
  }

  /**
   * Crée une nouvelle métadonnée (côté client - pour composants React)
   */
  static async createMetadata(
    metadataData: MetadataCreate
  ): Promise<MetadataResponse> {
    try {
      const response = await fetchWithAuth("/api/metadata-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...metadataData,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la création: ${errorMessage}`,
        data: null,
      };
    }
  }

  /**
   * Récupère toutes les métadonnées d'un sous-dossier (côté serveur)
   */
  static async getMetadataBySousDossierServer(
    sousDossierId: number
  ): Promise<MetadataResponse> {
    try {
      const metadata = await prisma.metadata_credit.findMany({
        where: {
          sous_dossier_id: sousDossierId,
        },
        include: {
          sous_dossiers: {
            select: {
              id: true,
              titre: true,
              description: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return {
        success: true,
        message: `${metadata.length} métadonnée(s) trouvée(s)`,
        data: metadata,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la récupération: ${errorMessage}`,
        data: null,
      };
    }
  }

  /**
   * Récupère toutes les métadonnées d'un sous-dossier (côté client)
   */
  static async getMetadataBySousDossier(
    sousDossierId: number
  ): Promise<MetadataResponse> {
    try {
      const response = await fetchWithAuth(
        `/api/metadata-credit?action=by-sous-dossier&sous_dossier_id=${sousDossierId}`
      );
      const result = await response.json();
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la récupération: ${errorMessage}`,
        data: null,
      };
    }
  }

  /**
   * Récupère une métadonnée par son ID
   */
  static async getMetadataById(id: number): Promise<MetadataResponse> {
    try {
      const response = await fetchWithAuth(`/api/metadata-credit/${id}`);
      const result = await response.json();
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la récupération: ${errorMessage}`,
        data: null,
      };
    }
  }

  /**
   * Met à jour une métadonnée
   */
  static async updateMetadata(
    id: number,
    updateData: MetadataUpdate
  ): Promise<MetadataResponse> {
    try {
      const response = await fetchWithAuth(`/api/metadata-credit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la mise à jour: ${errorMessage}`,
        data: null,
      };
    }
  }

  /**
   * Supprime une métadonnée
   */
  static async deleteMetadata(id: number): Promise<MetadataResponse> {
    try {
      const response = await fetchWithAuth(`/api/metadata-credit/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la suppression: ${errorMessage}`,
        data: null,
      };
    }
  }

  /**
   * Récupère toutes les métadonnées avec pagination
   */
  static async getAllMetadata(
    page: number = 1,
    limit: number = 10
  ): Promise<MetadataResponse> {
    try {
      const skip = (page - 1) * limit;

      const [metadata, total] = await Promise.all([
        prisma.metadata_credit.findMany({
          skip,
          take: limit,
          include: {
            sous_dossiers: {
              select: {
                id: true,
                titre: true,
                description: true,
                rubriques: {
                  select: {
                    id: true,
                    nom: true,
                  },
                },
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        }),
        prisma.metadata_credit.count(),
      ]);

      return {
        success: true,
        message: `${metadata.length} métadonnée(s) trouvée(s)`,
        data: {
          metadata,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la récupération: ${errorMessage}`,
        data: null,
      };
    }
  }

  /**
   * Recherche des métadonnées par nom
   */
  static async searchMetadata(searchTerm: string): Promise<MetadataResponse> {
    try {
      const metadata = await prisma.metadata_credit.findMany({
        where: {
          nom_meta: {
            contains: searchTerm,
          },
        },
        include: {
          sous_dossiers: {
            select: {
              id: true,
              titre: true,
              description: true,
              rubriques: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return {
        success: true,
        message: `${metadata.length} métadonnée(s) trouvée(s) pour "${searchTerm}"`,
        data: metadata,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la recherche: ${errorMessage}`,
        data: null,
      };
    }
  }

  /**
   * Obtient les statistiques des métadonnées
   */
  static async getMetadataStats(): Promise<MetadataResponse> {
    try {
      const [total, byType, bySousDossier] = await Promise.all([
        prisma.metadata_credit.count(),
        prisma.metadata_credit.groupBy({
          by: ["type_meta"],
          _count: {
            type_meta: true,
          },
        }),
        prisma.metadata_credit.groupBy({
          by: ["sous_dossier_id"],
          _count: {
            sous_dossier_id: true,
          },
          orderBy: {
            _count: {
              sous_dossier_id: "desc",
            },
          },
          take: 5,
        }),
      ]);

      return {
        success: true,
        message: "Statistiques récupérées",
        data: {
          total,
          byType,
          topSousDossiers: bySousDossier,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la récupération des statistiques: ${errorMessage}`,
        data: null,
      };
    }
  }
}
