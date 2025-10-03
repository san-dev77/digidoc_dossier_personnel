import { NextRequest, NextResponse } from "next/server";
import { DatabaseSchemaService } from "@/services/database-schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "tables":
        const tables = DatabaseSchemaService.getTablesDescription();
        return NextResponse.json({
          success: true,
          data: tables,
          timestamp: new Date().toISOString(),
        });

      case "stats":
        const stats = await DatabaseSchemaService.getDatabaseStats();
        return NextResponse.json({
          success: stats.success,
          data: stats.success ? stats.data : null,
          message: stats.success ? null : stats.message,
          timestamp: new Date().toISOString(),
        });

      case "sample":
        const tableName = searchParams.get("table");
        const limit = parseInt(searchParams.get("limit") || "5");

        if (!tableName) {
          return NextResponse.json(
            {
              success: false,
              message: 'Paramètre "table" requis pour l\'action "sample"',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        const sample = await DatabaseSchemaService.getTableSample(
          tableName,
          limit
        );
        return NextResponse.json({
          success: sample.success,
          data: sample.success ? sample.data : null,
          message: sample.success ? null : sample.message,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: true,
          data: DatabaseSchemaService.getTablesDescription(),
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: `Erreur: ${error.message}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
