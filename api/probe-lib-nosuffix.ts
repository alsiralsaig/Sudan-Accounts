import { handleParseSale } from './_lib/parseSaleService';
export default function handler(_req: any, res: any) {
  return res.status(200).json({ probe: 'lib-nosuffix', fnType: typeof handleParseSale });
}
