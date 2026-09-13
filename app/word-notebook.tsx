"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

export function WordNotebook() {
  const [words, setWords] = useState<Word[]>(seedWords);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "learning" | "mastered">("all");
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"library" | "test">("library");
  const [testIndex, setTestIndex] = useState(0);
  const [sentence, setSentence] = useState("");
  const [feedback, setFeedback] = useState<"" | "good" | "retry">("");
  const addInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/words").then((r) => r.ok ? r.json() : null).then((data) => {
      if (Array.isArray(data) && data.length) setWords(data);
    }).catch(() => {});
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
      const lookup = await fetch(`/api/lookup?word=${encodeURIComponent(value)}`);
      if (!lookup.ok) throw new Error();
      const entry = await lookup.json();
      const saved = await fetch("/api/words", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(entry) });
      const item = saved.ok ? await saved.json() : { ...entry, id: Date.now() };
      setWords((current) => [item, ...current]); setNewWord("");
    } catch {
      setNotice("사전에서 찾지 못했어요. 철자를 확인한 뒤 다시 시도해 주세요.");
    } finally { setLoading(false); }
  }

  async function toggleMastered(item: Word) {
    const updated = { ...item, mastered: !item.mastered };
    setWords((current) => current.map((word) => word.id === item.id ? updated : word));
    fetch(`/api/words/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ mastered: updated.mastered }) }).catch(() => {});
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

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => setMode("library")}><span className="brandMark">W</span><span>wordnotes</span></button>
        <nav aria-label="주요 메뉴">
          <button className={mode === "library" ? "active" : ""} onClick={() => setMode("library")}>단어장</button>
          <button className={mode === "test" ? "active" : ""} onClick={() => setMode("test")}>테스트</button>
        </nav>
        <button className="addButton" onClick={() => { setMode("library"); setTimeout(() => addInput.current?.focus(), 0); }}><span>＋</span> 단어 추가</button>
      </header>

      {mode === "library" ? <>
        <section className="hero">
          <div><p className="eyebrow">MY WORD COLLECTION</p><h1>오늘도 한 단어,<br/><em>내 것으로.</em></h1><p className="subtitle">마주친 단어를 기록하고, 문장 속에서 익혀보세요.</p></div>
          <div className="stat"><strong>{words.length}</strong><span>모은 단어</span><i/><strong>{words.filter(w => w.mastered).length}</strong><span>익힌 단어</span></div>
        </section>
        <section className="quickAdd" aria-label="새 단어 추가">
          <div><span className="quickIcon">＋</span><input ref={addInput} value={newWord} onChange={(e) => { setNewWord(e.target.value); setNotice(""); }} onKeyDown={(e) => e.key === "Enter" && addWord()} placeholder="새로 만난 영어 단어나 표현을 입력하세요" aria-label="추가할 영어 단어나 표현"/></div>
          <button disabled={loading || !newWord.trim()} onClick={addWord}>{loading ? "사전에서 찾는 중…" : "뜻과 예문 찾기"} <span>→</span></button>
          {notice && <p className="inlineError">{notice}</p>}
        </section>
        <section className="tools">
          <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="단어나 뜻 검색"/></label>
          <div className="filters">{(["all", "learning", "mastered"] as const).map((value) => <button key={value} className={filter === value ? "selected" : ""} onClick={() => setFilter(value)}>{value === "all" ? "전체" : value === "learning" ? "학습 중" : "익힘"}</button>)}</div>
        </section>
        <section className="wordGrid">
          {visible.map((item, index) => <article className="wordCard" key={item.id} style={{animationDelay: `${index * 50}ms`}}>
            <div className="cardTop"><div><div className="wordLine"><h2>{item.word}</h2><button className="sound" aria-label={`${item.word} 발음 듣기`} onClick={() => speechSynthesis.speak(new SpeechSynthesisUtterance(item.word))}>♪</button></div><p className="phonetic">{item.phonetic}</p></div><button onClick={() => toggleMastered(item)} className={`status ${item.mastered ? "done" : ""}`}>{item.mastered ? "✓ 익힘" : "○ 학습 중"}</button></div>
            <span className="pos">{item.partOfSpeech}</span><p className="definition">{item.definition}</p><p className="korean">{item.korean}</p>
            <div className="examples">{item.examples.slice(0, 2).map((example, i) => <p key={i}><span>{String(i + 1).padStart(2, "0")}</span>{example}</p>)}</div>
          </article>)}
          {!visible.length && <div className="empty">찾는 단어가 없어요.<br/>위 입력창에서 새 단어를 추가해 보세요.</div>}
        </section>
      </> : <section className="testPage">
        <div className="testIntro"><p className="eyebrow">USE IT IN A SENTENCE</p><h1>문장으로<br/><em>기억하기</em></h1><p>뜻을 떠올리며 나만의 예문을 만들어 보세요. 완벽하지 않아도 괜찮아요.</p></div>
        <div className="testCard"><div className="progress"><span>오늘의 연습</span><span>{testIndex + 1} / {words.length}</span></div><div className="progressBar"><i style={{width: `${((testIndex + 1) / words.length) * 100}%`}}/></div>
          <div className="prompt"><span className="pos">{testWord.partOfSpeech}</span><h2>{testWord.word}</h2><p>{testWord.korean}</p></div>
          <label htmlFor="sentence">이 단어를 사용해 영어 문장을 적어보세요.</label><textarea id="sentence" value={sentence} onChange={(e) => {setSentence(e.target.value); setFeedback("");}} placeholder={`Write a sentence using “${testWord.word}”...`}/>
          {feedback && <div className={`feedback ${feedback}`}><strong>{feedback === "good" ? "좋아요! 문장 안에서 잘 사용했어요." : "조금 더 다듬어 볼까요?"}</strong><p>{feedback === "good" ? "단어가 포함되고 충분한 문맥이 있는 문장이에요. 아래 사전 예문과 비교해 보세요." : `“${testWord.word}”를 직접 넣어 5단어 이상의 문장으로 적어 보세요.`}</p>{feedback === "good" && <blockquote>{testWord.examples[0]}</blockquote>}</div>}
          <div className="testActions"><button className="skip" onClick={nextQuestion}>건너뛰기</button><button className="check" onClick={feedback === "good" ? nextQuestion : checkSentence}>{feedback === "good" ? "다음 단어" : "문장 확인"} →</button></div>
        </div>
      </section>}

    </main>
  );
}
