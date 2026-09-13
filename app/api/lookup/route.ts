export async function GET(request: Request) {
  const word = new URL(request.url).searchParams.get("word")?.trim();
  if (!word) return Response.json({ error: "word required" }, { status: 400 });
  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (!response.ok) return Response.json({ error: "not found" }, { status: 404 });
  const [entry] = await response.json() as any[];
  const meaning = entry.meanings?.find((m: any) => m.definitions?.length) || entry.meanings?.[0];
  const definitions = meaning?.definitions || [];
  const definition = definitions[0]?.definition || "Definition unavailable.";
  let korean = "한국어 뜻을 불러오지 못했어요.";
  try {
    const translated = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(definition)}&langpair=en|ko`);
    const data = await translated.json() as any;
    if (data.responseData?.translatedText) korean = data.responseData.translatedText;
  } catch {}
  const examples = definitions.map((d: any) => d.example).filter(Boolean).slice(0, 3);
  if (!examples.length) examples.push(`I recently learned the word “${word}.”`);
  return Response.json({ word: entry.word || word, phonetic: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "", partOfSpeech: meaning?.partOfSpeech || "word", definition, korean, examples });
}
