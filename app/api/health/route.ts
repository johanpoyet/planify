import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/health - Sonde de disponibilité : processus applicatif et base de données.
// Destinée à un contrôle de supervision externe (intervalle court, sans authentification).
export async function GET() {
  const start = Date.now();

  try {
    await prisma.user.count();

    return NextResponse.json({
      status: 'ok',
      db: 'up',
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sonde de santé : base de données injoignable', error);
    return NextResponse.json(
      {
        status: 'degraded',
        db: 'down',
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
