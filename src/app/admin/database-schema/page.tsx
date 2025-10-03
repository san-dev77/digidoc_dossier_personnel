"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Table,
  Key,
  Link,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Users,
  FolderOpen,
  FileText,
  Bell,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  description: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: string;
}

interface RelationshipInfo {
  type: "one-to-one" | "one-to-many" | "many-to-many";
  table: string;
  field: string;
  description: string;
}

interface TableInfo {
  name: string;
  description: string;
  columns: ColumnInfo[];
  relationships: RelationshipInfo[];
  indexes: string[];
  sampleData?: unknown[];
}

interface DatabaseStats {
  agents: number;
  rubriques: number;
  agentRubriques: number;
  sousDossiers: number;
  pieces: number;
  metadataModels: number;
  metaValues: number;
  pieceFiles: number;
  piecesCheck: number;
  fiabilisations: number;
  notifications: number;
  metadataCredit: number;
}

export default function DatabaseSchemaPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSchemaData();
  }, []);

  const loadSchemaData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les tables et les stats en parallèle
      const [tablesResponse, statsResponse] = await Promise.all([
        fetch("/api/database-schema?action=tables"),
        fetch("/api/database-schema?action=stats"),
      ]);

      const tablesData = await tablesResponse.json();
      const statsData = await statsResponse.json();

      if (tablesData.success) {
        setTables(tablesData.data);
      } else {
        setError(tablesData.message);
      }

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Une erreur inconnue est survenue";
      setError(`Erreur lors du chargement: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTableExpansion = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case "agents":
        return <Users className="w-4 h-4" />;
      case "rubriques":
      case "sous_dossiers":
        return <FolderOpen className="w-4 h-4" />;
      case "pieces":
      case "piece_file":
        return <FileText className="w-4 h-4" />;
      case "notifications":
        return <Bell className="w-4 h-4" />;
      case "metadata_credit":
        return <Database className="w-4 h-4" />;
      default:
        return <Table className="w-4 h-4" />;
    }
  };

  const getColumnTypeColor = (type: string) => {
    if (type.includes("Int")) return "badge-primary";
    if (type.includes("String")) return "badge-secondary";
    if (type.includes("DateTime")) return "badge-accent";
    if (type.includes("Boolean")) return "badge-warning";
    return "badge-neutral";
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case "one-to-one":
        return "1:1";
      case "one-to-many":
        return "1:N";
      case "many-to-many":
        return "N:N";
      default:
        return "?";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">
            Chargement du schéma de base de données...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="alert alert-error max-w-md">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-base-content">
              Schéma de la Base de Données
            </h1>
          </div>
          <p className="text-base-content/70">
            Documentation complète de la structure de votre base de données
            Prisma
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-primary">
                  {getTableIcon(key)}
                </div>
                <div className="stat-title text-xs">{key}</div>
                <div className="stat-value text-lg">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tables List */}
        <div className="space-y-4">
          {tables.map((table) => {
            const isExpanded = expandedTables.has(table.name);

            return (
              <div key={table.name} className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  {/* Table Header */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleTableExpansion(table.name)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-primary" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-primary" />
                      )}
                      <div className="flex items-center gap-2">
                        {getTableIcon(table.name)}
                        <h2 className="card-title text-xl">{table.name}</h2>
                        <div className="badge badge-primary">
                          {table.columns.length} colonnes
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="badge badge-outline">
                        {table.relationships.length} relations
                      </div>
                      <div className="badge badge-outline">
                        {table.indexes.length} index
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-base-content/70 mt-2 ml-8">
                    {table.description}
                  </p>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-6 space-y-6">
                      {/* Columns */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          Colonnes ({table.columns.length})
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="table table-zebra w-full">
                            <thead>
                              <tr>
                                <th>Nom</th>
                                <th>Type</th>
                                <th>Nullable</th>
                                <th>Défaut</th>
                                <th>Description</th>
                                <th>Contraintes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {table.columns.map((column) => (
                                <tr key={column.name}>
                                  <td>
                                    <div className="flex items-center gap-2">
                                      {column.isPrimaryKey && (
                                        <Key className="w-3 h-3 text-primary" />
                                      )}
                                      {column.isForeignKey && (
                                        <Link className="w-3 h-3 text-secondary" />
                                      )}
                                      <span className="font-mono font-medium">
                                        {column.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <div
                                      className={`badge ${getColumnTypeColor(
                                        column.type
                                      )} badge-sm`}
                                    >
                                      {column.type}
                                    </div>
                                  </td>
                                  <td>
                                    {column.nullable ? (
                                      <CheckCircle className="w-4 h-4 text-success" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-warning" />
                                    )}
                                  </td>
                                  <td>
                                    {column.defaultValue && (
                                      <code className="text-xs bg-base-300 px-2 py-1 rounded">
                                        {column.defaultValue}
                                      </code>
                                    )}
                                  </td>
                                  <td className="text-sm">
                                    {column.description}
                                  </td>
                                  <td>
                                    <div className="flex gap-1">
                                      {column.isPrimaryKey && (
                                        <div className="badge badge-primary badge-xs">
                                          PK
                                        </div>
                                      )}
                                      {column.isForeignKey && (
                                        <div className="badge badge-secondary badge-xs">
                                          FK → {column.references}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Relationships */}
                      {table.relationships.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Link className="w-4 h-4" />
                            Relations ({table.relationships.length})
                          </h3>
                          <div className="grid gap-3">
                            {table.relationships.map((rel, index) => (
                              <div key={index} className="card bg-base-300 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="badge badge-outline">
                                      {getRelationshipIcon(rel.type)}
                                    </div>
                                    <span className="font-medium">
                                      {rel.table}
                                    </span>
                                    <span className="text-sm text-base-content/70">
                                      ({rel.field})
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-base-content/70 mt-2">
                                  {rel.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Indexes */}
                      {table.indexes.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Index ({table.indexes.length})
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {table.indexes.map((index) => (
                              <div key={index} className="badge badge-info">
                                {index}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="card bg-info/10 border border-info/20 shadow-xl mt-8">
          <div className="card-body">
            <h3 className="card-title text-info">Résumé du Schéma</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Tables :</strong> {tables.length}
              </div>
              <div>
                <strong>Colonnes totales :</strong>{" "}
                {tables.reduce((sum, table) => sum + table.columns.length, 0)}
              </div>
              <div>
                <strong>Relations :</strong>{" "}
                {tables.reduce(
                  (sum, table) => sum + table.relationships.length,
                  0
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
