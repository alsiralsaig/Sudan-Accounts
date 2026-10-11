import { handleParseSale } from './_lib/parseSaleService.js';
export default function handler(_req: any, res: any) {
  return res.status(200).json({ probe: 'lib-js', fnType: typeof handleParseSale });
}
