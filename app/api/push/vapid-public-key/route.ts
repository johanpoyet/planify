import { NextResponse } from 'next/server';

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { error: 'Clé VAPID non configurée' },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicKey });
}
