import { NextRequest } from 'next/server';
import { db } from '@/services/db';
import { generateBrochureBuffer } from '@/lib/brochure/generate';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const property = await db.getPropertyById(id);
    if (!property) {
      return Response.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    const buffer = await generateBrochureBuffer(property);

    const fileName = `brochure-${property.slug || property.id}.pdf`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating brochure:', error);
    return Response.json({ error: 'Error al generar el brochure' }, { status: 500 });
  }
}
