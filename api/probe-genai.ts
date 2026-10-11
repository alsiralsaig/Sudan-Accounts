export default async function handler(_req: any, res: any) {
  try {
    const g: any = await import('@google/genai');
    return res.status(200).json({ probe: 'genai', ok: Boolean(g && g.GoogleGenAI) });
  } catch (err: any) {
    return res.status(200).json({ probe: 'genai', ok: false, err: String(err && err.message ? err.message : err) });
  }
}
