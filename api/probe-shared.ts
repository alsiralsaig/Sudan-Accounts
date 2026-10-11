import { handleParseSale } from '../shared/parseSaleService';

export default function handler(_req: any, res: any) {
  return res.status(200).json({ probe: 'shared', fnType: typeof handleParseSale });
}
