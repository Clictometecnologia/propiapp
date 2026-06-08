import { NextResponse } from 'next/server';
import { db } from '@/services/db';

export async function GET() {
  try {
    const leads = await db.getLeads();
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json({ leads: [], error: String(error) }, { status: 500 });
  }
}