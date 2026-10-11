import { handleParseSale } from '../shared/parseSaleService.js';
export default function handler(_req: any, res: any) {
  return res.status(200).json({ probe: 'shared-js', fnType: typeof handleParseSale });
}
