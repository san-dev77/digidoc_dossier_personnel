import { NextRequest, NextResponse } from "next/server";
import { MigrationService } from "@/services/migration";

export async function GET() {
  try {
    const result = await MigrationService.checkDatabaseStatus();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.details,
      timestamp: new Date().toISOString(),
    });
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case "initialize":
        result = await MigrationService.initializeDatabase();
        break;

      case "generate":
        result = await MigrationService.generatePrismaClient();
        break;

      case "migrate":
        result = await MigrationService.runMigrations();
        break;

      case "reset":
        result = await MigrationService.resetDatabase();
        break;

      case "backup":
        result = await MigrationService.backupDatabase();
        break;

      case "status":
        result = await MigrationService.checkDatabaseStatus();
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            message:
              "Action non reconnue. Actions disponibles: initialize, generate, migrate, reset, backup, status",
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        data: result.details,
        action,
        timestamp: new Date().toISOString(),
      },
      { status: result.success ? 200 : 500 }
    );
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
