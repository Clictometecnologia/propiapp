import { NextResponse } from 'next/server';
import { db } from '@/services/db';
import { requireAuth } from '@/lib/supabase-server';

export async function GET() {
  try {
    await requireAuth();
    const leads = await db.getLeads();
    return NextResponse.json({ leads });
  } catch (error) {
    const message = String(error);
    if (message.includes('No autorizado')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json({ leads: [], error: message }, { status: 500 });
  }
}