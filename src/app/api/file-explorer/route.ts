import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface FileNode {
  name: string;
  type: "file" | "directory";
  path: string;
  size?: number;
  children?: FileNode[];
  extension?: string;
  modifiedAt?: string;
}

export async function GET(request: NextRequest) {
  try {
    const uploadsPath = path.join(process.cwd(), "uploads");

    if (!fs.existsSync(uploadsPath)) {
      return NextResponse.json(
        { error: "Dossier uploads non trouvé" },
        { status: 404 }
      );
    }

    const buildTree = (
      dirPath: string,
      relativePath: string = ""
    ): FileNode[] => {
      const items: FileNode[] = [];

      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        // Trier : dossiers d'abord, puis fichiers
        entries.sort((a, b) => {
          if (a.isDirectory() && b.isFile()) return -1;
          if (a.isFile() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const itemRelativePath = relativePath
            ? path.join(relativePath, entry.name)
            : entry.name;

          const node: FileNode = {
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
            path: itemRelativePath,
          };

          if (entry.isFile()) {
            try {
              const stats = fs.statSync(fullPath);
              node.size = stats.size;
              node.extension = path.extname(entry.name).toLowerCase();
              node.modifiedAt = stats.mtime.toISOString();
            } catch (error) {
              console.warn(
                `Impossible de lire les stats du fichier ${fullPath}:`,
                error
              );
            }
          } else if (entry.isDirectory()) {
            try {
              node.children = buildTree(fullPath, itemRelativePath);
            } catch (error) {
              console.warn(`Impossible de lire le dossier ${fullPath}:`, error);
              node.children = [];
            }
          }

          items.push(node);
        }
      } catch (error) {
        console.warn(`Impossible de lire le dossier ${dirPath}:`, error);
      }

      return items;
    };

    const tree = buildTree(uploadsPath);

    return NextResponse.json({
      success: true,
      data: {
        root: "uploads",
        tree,
        totalFiles: countFiles(tree),
        totalDirectories: countDirectories(tree),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la lecture de l'arborescence:", error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture de l'arborescence" },
      { status: 500 }
    );
  }
}

function countFiles(nodes: FileNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "file") {
      count++;
    } else if (node.children) {
      count += countFiles(node.children);
    }
  }
  return count;
}

function countDirectories(nodes: FileNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "directory") {
      count++;
      if (node.children) {
        count += countDirectories(node.children);
      }
    }
  }
  return count;
}
