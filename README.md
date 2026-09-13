# wordnotes

모르는 영어 단어와 표현을 모으고 문장으로 익히는 개인 단어장입니다.

**웹사이트:** <https://shukjaechoi.github.io/word-notes/>

## 주요 기능

- 영어 단어·표현을 입력하면 영영 뜻, 한국어 뜻, 예문 자동 조회
- 브라우저의 영어 TTS 음성으로 발음 재생
- 전체, 학습 중, 익힘 상태별 필터와 단어 검색
- 학습 완료 상태 저장
- 단어를 활용해 직접 예문을 작성하는 테스트
- PC에서 페이지를 열고 바로 타이핑한 뒤 Enter로 등록
- 휴대폰과 PC에 최적화된 반응형 화면
- Supabase 이메일 매직 링크 로그인과 기기 간 데이터 동기화

## 사용법

1. 웹사이트를 열고 사용할 이메일 주소로 로그인 링크를 요청합니다.
2. 받은 이메일의 링크를 누르면 개인 단어장이 열립니다.
3. 상단의 `단어/표현 입력` 칸에 영어를 입력하고 Enter를 누릅니다.
4. 자동으로 추가된 뜻과 예문을 읽고 발음 버튼으로 소리를 확인합니다.
5. 익힌 단어는 `학습 중` 버튼을 눌러 `익힘` 상태로 변경합니다.
6. `테스트` 탭에서 해당 단어를 사용한 영어 문장을 작성합니다.

같은 브라우저에서는 로그인 세션이 유지됩니다. 다른 기기나 브라우저에서는 같은 이메일로 최초 한 번 로그인하면 동일한 단어 목록을 볼 수 있습니다.

## 구성

- React + TypeScript + Vite
- GitHub Pages 및 GitHub Actions 자동 배포
- Supabase Auth, Postgres, Row Level Security
- Free Dictionary API와 Datamuse fallback

## Supabase 준비

1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql)을 실행합니다.
3. Authentication → URL Configuration에서 Site URL과 Redirect URL을 GitHub Pages 주소로 지정합니다.
4. GitHub 저장소의 Actions Variables에 다음 값을 추가합니다.
   - `VITE_SUPABASE_URL`: Supabase Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase Publishable key
5. GitHub 저장소 Settings → Pages → Source에서 **GitHub Actions**를 선택합니다.

`service_role` 키와 데이터베이스 비밀번호는 브라우저나 GitHub 변수에 저장하지 마세요.

## 로컬 실행

`.env.example`을 `.env.local`로 복사해 Supabase 값을 채운 후 실행합니다.

```bash
npm install
npm run dev
```

배포용 빌드 확인:

```bash
npm run build
```

## 데이터 보호

이메일 매직 링크로 로그인하며, Supabase Row Level Security 정책에 따라 각 사용자는 자신의 단어만 읽고 수정할 수 있습니다. 저장소와 웹 화면이 공개되어도 개인 단어 데이터는 공개되지 않습니다.
