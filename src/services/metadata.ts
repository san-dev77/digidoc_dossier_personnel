import type { MetadataModel } from "@/types";

export const metadataService = {
  async updateMetadata(
    id: string,
    updates: Partial<Omit<MetadataModel, "id" | "createdAt" | "updatedAt">>
  ): Promise<MetadataModel> {
    try {
      console.log("🔧 Service updateMetadata - ID:", id);
      console.log("📝 Service updateMetadata - Updates:", updates);

      const response = await fetch(`/api/metadata/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libelle: updates.nom,
          type: updates.type,
          obligatoire: updates.obligatoire,
          description: updates.description,
        }),
      });

      console.log(
        "📡 Réponse API metadata:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la métadonnée");
      }

      const data = await response.json();
      console.log("✅ Métadonnée mise à jour:", data);

      return {
        id: data.id.toString(),
        nom: data.nom,
        type: data.type,
        obligatoire: data.obligatoire,
        description: data.description,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la mise à jour de la métadonnée:",
        error
      );
      throw error;
    }
  },

  async deleteMetadata(id: string): Promise<{ hasRemainingMetadata: boolean }> {
    try {
      console.log("🗑️ Service deleteMetadata - ID:", id);

      const response = await fetch(`/api/metadata/${id}`, {
        method: "DELETE",
      });

      console.log(
        "📡 Réponse API delete metadata:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la métadonnée");
      }

      const data = await response.json();
      console.log("✅ Métadonnée supprimée:", data);

      return {
        hasRemainingMetadata: data.hasRemainingMetadata,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la suppression de la métadonnée:",
        error
      );
      throw error;
    }
  },
};
