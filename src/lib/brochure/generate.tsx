import { renderToBuffer } from '@react-pdf/renderer';
import BrochurePDF from './BrochurePDF';
import type { Property } from '@/types';

export async function generateBrochureBuffer(property: Property): Promise<ArrayBuffer> {
  const element = <BrochurePDF property={property} />;
  const nodeBuffer = await renderToBuffer(element);
  const uint8 = new Uint8Array(nodeBuffer);
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
}
