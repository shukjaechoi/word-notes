"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../src/supabase";

type Word = {
  id: number;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  korean: string;
  examples: string[];
  mastered: boolean;
};

const seedWords: Word[] = [
  { id: 1, word: "serendipity", phonetic: "/ˌserənˈdɪpəti/", partOfSpeech: "noun", definition: "The occurrence of finding pleasant or useful things by chance.", korean: "뜻밖의 발견, 행운의 우연", examples: ["Finding that tiny bookshop was pure serendipity.", "Their meeting was a happy act of serendipity."], mastered: false },
  { id: 2, word: "meticulous", phonetic: "/məˈtɪkjələs/", partOfSpeech: "adjective", definition: "Showing great attention to every detail.", korean: "꼼꼼한, 세심한", examples: ["She kept meticulous notes throughout the project.", "The model was built with meticulous care."], mastered: true },
  { id: 3, word: "on the fence", phonetic: "expression", partOfSpeech: "idiom", definition: "Unable to decide between two possibilities.", korean: "결정을 못 내리는, 망설이는", examples: ["I’m still on the fence about moving abroad.", "Voters remain on the fence before the debate."], mastered: false },
];

type LookupEntry = Omit<Word, "id" | "mastered">;

function fallbackExamples(word: string, partOfSpeech: string) {
  if (partOfSpeech === "verb") return [`They decided to ${word} before the meeting ended.`, `It can be difficult to ${word} without enough information.`];
  if (partOfSpeech === "adjective" || partOfSpeech === "adj") return [`The situation became ${word} as the deadline approached.`, `Her description made the problem sound ${word}.`];
  if (word.includes(" ")) return [`She used the expression “${word}” during our conversation.`, `I finally understood what “${word}” meant in that context.`];
  return [`The ${word} became an important part of our discussion.`, `I encountered the word “${word}” while reading today.`];
}

async function lookupWord(value: string): Promise<LookupEntry> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(value)}`, { signal: AbortSignal.timeout(4500) });
    if (!response.ok) throw new Error("primary dictionary unavailable");
    const [entry] = await response.json();
    const meaning = entry.meanings?.find((item: { definitions?: unknown[] }) => item.definitions?.length) || entry.meanings?.[0];
    const definitions = meaning?.definitions || [];
    const definition = definitions[0]?.definition || "Definition unavailable.";
    const examples = definitions.map((item: { example?: string }) => item.example).filter(Boolean).slice(0, 3);
    return { word: entry.word || value, phonetic: entry.phonetic || entry.phonetics?.find((item: { text?: string }) => item.text)?.text || "", partOfSpeech: meaning?.partOfSpeech || "word", definition, korean: "", examples: examples.length ? examples : fallbackExamples(value, meaning?.partOfSpeech || "word") };
  } catch {
    const response = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(value)}&md=d,p&max=1`, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error("fallback dictionary unavailable");
    const [entry] = await response.json();
    if (!entry || entry.word.toLowerCase() !== value.toLowerCase() || !entry.defs?.length) throw new Error("word not found");
    const [part = "word", definition = "Definition unavailable."] = entry.defs[0].split("\t");
    const partOfSpeech = part === "adj" ? "adjective" : part === "adv" ? "adverb" : part === "v" ? "verb" : part === "n" ? "noun" : part;
    return { word: entry.word, phonetic: "", partOfSpeech, definition, korean: "", examples: fallbackExamples(entry.word, partOfSpeech) };
  }
}

function speakEnglish(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === "en-us")
    || voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
    || null;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function WordNotebook() {
  const [words, setWords] = useState<Word[]>([]);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "learning" | "mastered">("learning");
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"library" | "test">("library");
  const [testIndex, setTestIndex] = useState(0);
  const [sentence, setSentence] = useState("");
  const [feedback, setFeedback] = useState<"" | "good" | "retry">("");
  const addInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setUserId(null); return; }
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    supabase.from("words").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error) { setNotice("단어를 불러오지 못했어요. Supabase 설정을 확인해 주세요."); return; }
      setWords((data || []).map((row) => ({ id: row.id, word: row.word, phonetic: row.phonetic, partOfSpeech: row.part_of_speech, definition: row.definition, korean: row.korean, examples: row.examples, mastered: row.mastered })));
    });
  }, [userId]);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 701px)").matches) return;
    addInput.current?.focus();
    const typeToAdd = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isEditing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;
      if (isEditing || event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) return;
      event.preventDefault();
      setMode("library");
      setNewWord((current) => current + event.key);
      requestAnimationFrame(() => addInput.current?.focus());
    };
    window.addEventListener("keydown", typeToAdd);
    return () => window.removeEventListener("keydown", typeToAdd);
  }, []);

  const visible = useMemo(() => words.filter((item) => {
    const matchesText = `${item.word} ${item.korean} ${item.definition}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "mastered" ? item.mastered : !item.mastered);
    return matchesText && matchesFilter;
  }), [words, query, filter]);

  async function addWord() {
    const value = newWord.trim();
    if (!value || words.some((item) => item.word.toLowerCase() === value.toLowerCase())) return;
    setLoading(true); setNotice("");
    try {
      const entry = await lookupWord(value);
      let korean = "한국어 뜻을 불러오지 못했어요.";
      try {
        const translation = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(entry.definition)}&langpair=en|ko`, { signal: AbortSignal.timeout(6000) });
        const translated = await translation.json();
        korean = translated.responseData?.translatedText || korean;
      } catch { /* English definition remains available. */ }
      entry.korean = korean;
      const { data, error } = await supabase.from("words").insert({ user_id: userId, word: entry.word, phonetic: entry.phonetic, part_of_speech: entry.partOfSpeech, definition: entry.definition, korean: entry.korean, examples: entry.examples }).select().single();
      if (error) throw error;
      const item = { ...entry, id: data.id, mastered: false };
      setWords((current) => [item, ...current]); setNewWord("");
    } catch {
      setNotice("단어를 조회하거나 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally { setLoading(false); }
  }

  async function toggleMastered(item: Word) {
    const updated = { ...item, mastered: !item.mastered };
    setWords((current) => current.map((word) => word.id === item.id ? updated : word));
    const { error } = await supabase.from("words").update({ mastered: updated.mastered }).eq("id", item.id);
    if (error) setWords((current) => current.map((word) => word.id === item.id ? item : word));
  }

  async function sendMagicLink() {
    if (!email.trim()) return;
    setLoading(true); setAuthNotice("");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.href.split("#")[0].split("?")[0] } });
    setAuthNotice(error ? error.message : "로그인 링크를 이메일로 보냈어요. 메일함을 확인해 주세요.");
    setLoading(false);
  }

  function checkSentence() {
    const answer = sentence.toLowerCase();
    const target = words[testIndex]?.word.toLowerCase() ?? "";
    const used = answer.includes(target);
    const enoughContext = answer.trim().split(/\s+/).length >= 5;
    setFeedback(used && enoughContext ? "good" : "retry");
  }

  function nextQuestion() {
    setTestIndex((value) => (value + 1) % words.length); setSentence(""); setFeedback("");
  }

  const testWord = words[testIndex] ?? seedWords[0];

  if (!isSupabaseConfigured) return <main className="authPage"><section className="authCard"><span className="brandMark">W</span><p className="eyebrow">ONE-TIME SETUP</p><h1>Supabase 연결이 필요해요</h1><p>GitHub 저장소의 Pages 환경 변수에 Project URL과 Publishable key를 등록하면 단어장이 열립니다.</p></section></main>;
  if (userId === undefined) return <main className="authPage"><p>단어장을 여는 중…</p></main>;
  if (!userId) return <main className="authPage"><section className="authCard"><span className="brandMark">W</span><p className="eyebrow">PRIVATE WORD NOTEBOOK</p><h1>내 단어장에 로그인</h1><p>비밀번호 없이 이메일로 받은 링크를 눌러 로그인합니다.</p><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMagicLink()} placeholder="email@example.com"/><button onClick={sendMagicLink} disabled={loading || !email.trim()}>{loading ? "보내는 중…" : "로그인 링크 받기 →"}</button>{authNotice && <p className="authNotice">{authNotice}</p>}</section></main>;

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => setMode("library")}><span className="brandMark">W</span><span>wordnotes</span></button>
        <nav aria-label="주요 메뉴">
          <button className={mode === "library" ? "active" : ""} onClick={() => setMode("library")}>단어장</button>
          <button className={mode === "test" ? "active" : ""} onClick={() => setMode("test")}>테스트</button>
        </nav>
        <div className="headerActions"><button className="logout" onClick={() => supabase.auth.signOut()}>로그아웃</button></div>
      </header>

      {mode === "library" ? <>
        <section className="quickAdd" aria-label="새 단어 추가">
          <div><span className="quickIcon">＋</span><input ref={addInput} value={newWord} onChange={(e) => { setNewWord(e.target.value); setNotice(""); }} onKeyDown={(e) => e.key === "Enter" && addWord()} placeholder="단어/표현 입력" aria-label="추가할 영어 단어나 표현"/></div>
          <button disabled={loading || !newWord.trim()} onClick={addWord}>{loading ? "사전에서 찾는 중…" : "뜻과 예문 찾기"} <span>→</span></button>
          {notice && <p className="inlineError">{notice}</p>}
        </section>
        <section className="tools">
          <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="단어나 뜻 검색"/></label>
          <div className="filters">{(["all", "learning", "mastered"] as const).map((value) => <button key={value} className={filter === value ? "selected" : ""} onClick={() => setFilter(value)}>{value === "all" ? "전체" : value === "learning" ? "학습 중" : "익힘"}</button>)}</div>
        </section>
        <section className="wordGrid">
          {visible.map((item, index) => <article className="wordCard" key={item.id} style={{animationDelay: `${index * 50}ms`}}>
            <div className="cardTop"><div><div className="wordLine"><h2>{item.word}</h2><button className="sound" aria-label={`${item.word} 영어 발음 듣기`} onClick={() => speakEnglish(item.word)}>♪</button></div><p className="phonetic">{item.phonetic}</p></div><button onClick={() => toggleMastered(item)} className={`status ${item.mastered ? "done" : ""}`}>{item.mastered ? "✓ 익힘" : "○ 학습 중"}</button></div>
            <span className="pos">{item.partOfSpeech}</span><p className="definition">{item.definition}</p><p className="korean">{item.korean}</p>
            <div className="examples">{item.examples.slice(0, 2).map((example, i) => <p key={i}><span>{String(i + 1).padStart(2, "0")}</span>{example}</p>)}</div>
          </article>)}
          {!visible.length && <div className="empty">찾는 단어가 없어요.<br/>위 입력창에서 새 단어를 추가해 보세요.</div>}
        </section>
      </> : <section className="testPage compactTestPage">
        <div className="testCard"><div className="progress"><span>오늘의 연습</span><span>{words.length ? testIndex + 1 : 0} / {words.length}</span></div><div className="progressBar"><i style={{width: `${words.length ? ((testIndex + 1) / words.length) * 100 : 0}%`}}/></div>
          <div className="prompt"><span className="pos">{testWord.partOfSpeech}</span><h2>{testWord.word}</h2><p>{testWord.korean}</p></div>
          <label htmlFor="sentence">이 단어를 사용해 영어 문장을 적어보세요.</label><textarea id="sentence" value={sentence} onChange={(e) => {setSentence(e.target.value); setFeedback("");}} placeholder={`Write a sentence using “${testWord.word}”...`}/>
          {feedback && <div className={`feedback ${feedback}`}><strong>{feedback === "good" ? "좋아요! 문장 안에서 잘 사용했어요." : "조금 더 다듬어 볼까요?"}</strong><p>{feedback === "good" ? "단어가 포함되고 충분한 문맥이 있는 문장이에요. 아래 사전 예문과 비교해 보세요." : `“${testWord.word}”를 직접 넣어 5단어 이상의 문장으로 적어 보세요.`}</p>{feedback === "good" && <blockquote>{testWord.examples[0]}</blockquote>}</div>}
          <div className="testActions"><button className="skip" onClick={nextQuestion}>건너뛰기</button><button className="check" onClick={feedback === "good" ? nextQuestion : checkSentence}>{feedback === "good" ? "다음 단어" : "문장 확인"} →</button></div>
        </div>
      </section>}

    </main>
  );
}
