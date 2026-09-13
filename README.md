# wordnotes

GitHub Pages와 Supabase로 운영하는 개인 영어 단어장입니다.

## Supabase 준비

1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql)을 실행합니다.
3. Authentication → URL Configuration에서 Site URL을 `https://shukjaechoi.github.io/word-notes/`로 설정하고 같은 주소를 Redirect URLs에도 추가합니다.
4. GitHub 저장소 Settings → Environments → `github-pages` → Environment variables에 다음 두 값을 추가합니다.
   - `VITE_SUPABASE_URL`: Supabase Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase Publishable key (또는 legacy anon key)
5. GitHub 저장소 Settings → Pages → Source에서 **GitHub Actions**를 선택합니다.
6. Actions 탭에서 `Deploy GitHub Pages`를 다시 실행합니다.

`service_role` 키는 브라우저나 GitHub 변수에 절대 저장하지 마세요.

## 로컬 실행

`.env.example`을 `.env.local`로 복사해 두 값을 채운 후 다음을 실행합니다.

```bash
npm install
npm run dev
```

## 데이터 보호

이메일 매직 링크로 로그인하며, Row Level Security 정책으로 각 사용자는 자신의 단어만 읽고 수정할 수 있습니다.
