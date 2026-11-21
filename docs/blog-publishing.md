# 블로그 초안과 발행

한 주제는 `src/content/blog/<slug>/`에 저장합니다. 파일 이름은 서비스의 언어 코드와 맞춥니다. 예를 들어 한국어는 `ko.md`, 이집트 아랍어는 `ar-EG.md`입니다. 각 Markdown 파일에는 해당 언어의 `title`, `description`, 본문을 작성합니다.

1. 새 주제의 `publication.json`에 `{ "draft": true }`를 저장합니다.
2. `corepack pnpm dev`에서 `/<locale>/blog/<slug>/`를 열어 검토합니다. 글의 언어 메뉴에서 같은 주제의 다른 번역을 확인할 수 있습니다.
3. 제목과 본문을 검토하고 발행을 승인받으면 `publication.json`의 `draft`를 `false`로 바꾸고 실제 발행일을 `publishedOn`에 `YYYY-MM-DD` 형식으로 입력합니다. 22개 언어 파일이 모두 있어야 공개 빌드가 생성됩니다.

발행된 글이 있으면 해당 언어 홈 하단에 블로그 링크가 나타납니다. 블로그 목록과 글 주소는 사이트맵에 포함됩니다. Nigerian Pidgin(`pcm`)은 자체 주소와 사이트맵으로 접근할 수 있습니다. Google이 지원하는 언어 코드는 같은 주제의 다른 글과 `hreflang`으로 연결합니다.
