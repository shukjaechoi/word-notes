import { env } from "cloudflare:workers";

const schema = `CREATE TABLE IF NOT EXISTS words (id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT NOT NULL UNIQUE, phonetic TEXT NOT NULL DEFAULT '', part_of_speech TEXT NOT NULL DEFAULT 'word', definition TEXT NOT NULL, korean TEXT NOT NULL DEFAULT '', examples TEXT NOT NULL DEFAULT '[]', mastered INTEGER NOT NULL DEFAULT 0)`;

export async function GET() {
  await env.DB.prepare(schema).run();
  const result = await env.DB.prepare("SELECT id, word, phonetic, part_of_speech as partOfSpeech, definition, korean, examples, mastered FROM words ORDER BY id DESC").all();
  return Response.json(result.results.map((row: any) => ({ ...row, examples: JSON.parse(row.examples as string), mastered: Boolean(row.mastered) })));
}

export async function POST(request: Request) {
  await env.DB.prepare(schema).run();
  const body = await request.json() as any;
  const result = await env.DB.prepare("INSERT INTO words (word, phonetic, part_of_speech, definition, korean, examples) VALUES (?, ?, ?, ?, ?, ?) RETURNING id").bind(body.word, body.phonetic || "", body.partOfSpeech || "word", body.definition, body.korean || "", JSON.stringify(body.examples || [])).first<{id:number}>();
  return Response.json({ ...body, id: result?.id, mastered: false });
}
