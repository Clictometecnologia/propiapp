import { db } from '@/services/db';
import { getUFValue } from './actions';
import Cotizador from './Cotizador';

export const dynamic = 'force-dynamic';

export default async function CotizadorPage() {
  const [properties, ufValue] = await Promise.all([
    db.getProperties({ onlyPublished: true }),
    getUFValue(),
  ]);

  return <Cotizador properties={properties} ufValue={ufValue} />;
}
