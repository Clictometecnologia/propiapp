'use server';

export async function getUFValue(): Promise<number> {
  try {
    const res = await fetch('https://mindicador.cl/api/uf', {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.uf?.valor ?? 40771.41;
  } catch {
    return 40771.41;
  }
}
