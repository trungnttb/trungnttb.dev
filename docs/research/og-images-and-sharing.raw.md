---
subject: Tạo ảnh Open Graph tĩnh trong Astro, và nút chia sẻ trên trang chi tiết post/note
as-of: 2026-09-25
language: vi
project: portfolio — Astro 7.3.5 (output static), pnpm 12.6.0, Node 24.12.0 trên máy dev
sandbox: scratchpad/og-sandbox (chỉ tồn tại trong phiên làm việc, không nằm trong repo) — npm, satori 0.33.5, @resvg/resvg-js 2.6.2, @fontsource/jetbrains-mono 5.3.0
sources:
  - https://github.com/vercel/satori (README, đọc 2026-09-25)
  - https://raw.githubusercontent.com/delucis/astro-og-canvas/latest/packages/astro-og-canvas/README.md (đọc 2026-09-25)
  - https://developers.facebook.com/docs/sharing/webmasters
  - https://developers.facebook.com/docs/sharing/best-practices
  - https://www.linkedin.com/help/linkedin/answer/a521928
  - https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
  - https://css-tricks.com/simple-social-sharing-links/ (nguồn thứ cấp cho URL chia sẻ LinkedIn)
  - https://developers.zalo.me/docs/social/share (trang render bằng JS, WebFetch không đọc được nội dung)
  - tài liệu của X về summary_large_image: developer.x.com trả HTTP 402, docs.x.com trả 404 — thông số X chỉ có từ nguồn thứ cấp
labels: ran = đã chạy, output dán nguyên văn · docs = đọc trong tài liệu chính thức · verify = chưa thấy nguyên văn, cần kiểm lại · inferred = suy ra, chưa chạy
---

# Ảnh OG tĩnh trong Astro và nút chia sẻ

> Mỗi trang post/note cần một bộ thẻ meta OG và một ảnh 1200×630 được sinh lúc build, để khi dán link
> vào Facebook, X, LinkedIn, Zalo, Slack hay Discord thì hiện thẻ xem trước; nút chia sẻ nên là một
> nút "Chia sẻ" dùng Web Share API, kèm "Copy link" và vài link chia sẻ của từng nền tảng khi trình
> duyệt không hỗ trợ.

**Điều cần biết trước mọi thứ khác:** dự án hiện **chưa có `site`** trong `astro.config.ts`, chưa có
thẻ `og:*`, `twitter:*` hay `<link rel="canonical">` nào (`ran`: `grep -n "site" astro.config.ts` và
`grep -rn "og:\|twitter:" src` đều không ra dòng nào liên quan). Các nền tảng cần URL tuyệt đối cho
`og:image` và `og:url`, nên dù chọn cách sinh ảnh nào thì bước đầu tiên vẫn là khai báo
`site: 'https://trungnttb.dev'`.

## 1. Các thẻ meta mà nền tảng đọc

> Nền tảng không chạy JavaScript của trang; crawler chỉ đọc thẻ `<meta>` trong HTML tĩnh của đúng URL
> được chia sẻ.

- **Intro:** khai báo tiêu đề, mô tả, ảnh và URL chuẩn của trang cho crawler của các nền tảng.
- **Purpose:** Facebook, LinkedIn, Zalo, Slack, Discord dựng thẻ xem trước từ các thẻ `og:*`; X đọc
  thêm `twitter:card` để biết dùng thẻ ảnh lớn.
- **Input:** dữ liệu frontmatter của post (`title`, `summary`) và note (`title`, `description`), URL
  trang, URL ảnh OG.
- **Output:** trong `<head>` của `dist/posts/<id>/index.html` và `dist/notes/<id>/index.html`.
- **What it does:**
  - Facebook liệt kê các thẻ cơ bản: `og:url`, `og:title`, `og:description`, `og:image`, và
    `fb:app_id` "required for Facebook Insights analytics" (`docs`, webmasters). `fb:app_id` chỉ cần
    khi muốn xem thống kê, không cần để hiện thẻ xem trước (`inferred`).
  - Facebook khuyên khai báo kích thước ảnh: "Use `og:image:width` and `og:image:height` Open Graph
    tags to specify the image dimensions to the crawler so that it can render the image immediately"
    (`docs`, best-practices).
  - LinkedIn đọc `og:title`, `og:image`, `og:description`, `og:url` (`docs`).
  - X cần `<meta name="twitter:card" content="summary_large_image">` để hiện ảnh lớn (`verify` — tài
    liệu chính thức của X không truy cập được, xem front matter). X có dùng lại `og:title`,
    `og:image` khi thiếu `twitter:title`, `twitter:image` hay không cũng là `verify`.
    Cách kiểm: dán URL đã deploy vào ô soạn bài trên x.com, xem thẻ xem trước.
  - Slack và Discord đọc thẻ OG (`verify`; chưa đọc tài liệu của hai nền tảng này).
    Cách kiểm: dán URL đã deploy vào một kênh thử.
  - Trang chi tiết của dự án đã được sinh tĩnh ở `/posts/<id>/` và `/notes/<id>/` (theo D6 trong
    `docs/design.md`), nên crawler nhận được HTML có sẵn nội dung, không cần chạy JS (`inferred` từ
    `src/pages/posts/[id].astro`).
- **Result / gate:** Sharing Debugger của Facebook (https://developers.facebook.com/tools/debug/,
  `docs`) hiện đúng tiêu đề, mô tả và ảnh cho một URL đã deploy. Hiện chưa có gate nào tự động.

Bộ thẻ đề xuất cho mỗi trang chi tiết (`inferred`, chưa build thử):

```html
<link rel="canonical" href="https://trungnttb.dev/posts/<id>/" />
<meta property="og:type" content="article" />
<meta property="og:url" content="https://trungnttb.dev/posts/<id>/" />
<meta property="og:title" content="<title>" />
<meta property="og:description" content="<summary>" />
<meta property="og:image" content="https://trungnttb.dev/og/posts/<id>.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="<title>" />
<meta property="og:locale" content="vi_VN" />
<meta name="twitter:card" content="summary_large_image" />
```

## 2. Kích thước và định dạng ảnh

> Một ảnh PNG 1200×630 (tỉ lệ 1,91:1) nằm trong yêu cầu của cả Facebook, LinkedIn và X.

- **Intro:** chọn một kích thước ảnh dùng chung cho mọi nền tảng.
- **Purpose:** tránh phải sinh nhiều ảnh cho mỗi bài.
- **Input / Output:** không có file; đây là ràng buộc cho mục 3 và 4.
- **What it does:** so các yêu cầu đã đọc được:

| Nền tảng | Yêu cầu | Nhãn |
|---|---|---|
| Facebook | "at least 1080 pixels in width for best display on high resolution devices"; tối thiểu 600px chiều rộng cho image link ads | `docs` |
| LinkedIn | "Max file size: 5 MB"; "Minimum image dimensions: 1200 (w) x 627 (h) pixels"; "Recommended ratio: 1.91:1" | `docs` |
| X (summary_large_image) | tối thiểu 300×157, tối đa 4096×4096, dưới 5 MB, JPG/PNG/WEBP/GIF, tỉ lệ 2:1 | `verify` — chỉ có từ các bài tổng hợp, không đọc được tài liệu của X |
| Zalo, Slack, Discord | chưa tìm được yêu cầu | `unknown` |

  1200×630 đạt tối thiểu 1200×627 của LinkedIn và ≥1080px của Facebook. So với tỉ lệ 2:1 của X, ảnh
  1,91:1 có thể bị cắt khoảng 15px mỗi cạnh trên và dưới (`inferred`: 1200/2 = 600, (630−600)/2 = 15),
  nên không đặt chữ sát mép trên và mép dưới.
- **Result / gate:** PNG sinh ra có kích thước đúng 1200×630 và dưới 5 MB. Ảnh thử trong sandbox nặng
  25–28 KB (mục Numbers).

## 3. Phương án A — satori + @resvg/resvg-js trong một endpoint Astro

> Dựng bố cục ảnh bằng một cây phần tử kiểu JSX (flexbox), `satori` đổi ra SVG, `resvg` đổi SVG ra
> PNG; chạy trong Node lúc build, không cần trình duyệt.

- **Intro:** sinh một PNG cho mỗi post/note lúc `astro build`, qua một endpoint tĩnh
  `src/pages/og/[collection]/[id].png.ts` (`inferred`: tên file là đề xuất, chưa tạo).
- **Purpose:** kiểm soát toàn bộ bố cục để ảnh theo đúng theme cafe của site.
- **Input:**
  - `satori` 0.33.5, `engines.node >=16`; `@resvg/resvg-js` 2.6.2 (`ran`: `npm view`).
  - Font: satori "supports TTF, OTF, and WOFF … WOFF2 is not supported at the moment" (`docs`). Font
    phải truyền vào dạng `Buffer`/`ArrayBuffer`, không tải qua `<link>` (`docs`).
  - CSS: chỉ một tập con, bố cục bằng flexbox; không có `calc`, `z-index`, transform 3D, thẻ `<style>`
    (`docs`).
- **Output:** `dist/og/posts/<id>.png`, `dist/og/notes/<id>.png` (`inferred`).
- **What it does:** đã chạy thử trong sandbox với tiêu đề bài Jev và một chuỗi nhiều dấu
  (`Đường, Ước, Ỹ, ặ`), font JetBrains Mono từ `@fontsource` (`ran`, script `render.mjs`):
  - Chỉ nạp subset `vietnamese`: mọi chữ Latin cơ bản hiện thành ô vuông, chỉ các chữ riêng của
    tiếng Việt (ả, ờ, ằ, ữ, Đ, ư…) hiện đúng. Lý do: subset `vietnamese` của fontsource chỉ chứa phần
    ký tự riêng của tiếng Việt (`inferred` từ kết quả).
  - Nạp cả 3 subset `latin`, `latin-ext`, `vietnamese` **cùng một tên** `JetBrains Mono`: chữ Latin
    hiện đúng, nhưng `ờ`, `ằ`, `ữ`, `Đ`, `ư`, `ặ` vẫn thành ô vuông. Satori không lấy glyph từ các
    file cùng tên và cùng weight với nhau (`ran`, quan sát; chưa đọc code satori để biết cơ chế).
  - Nạp 3 subset với **3 tên khác nhau** (`JB latin`, `JB latin-ext`, `JB vietnamese`) và đặt
    `fontFamily: 'JB latin, JB latin-ext, JB vietnamese'`: **mọi ký tự hiện đúng** (`ran`).
  - Thời gian: lần đầu 1165 ms (có khởi tạo WASM), các lần sau khoảng 150 ms mỗi ảnh (`ran`).
  - Kết luận cho dự án: dùng fontsource thì phải đăng ký mỗi subset dưới một tên riêng, hoặc dùng một
    file TTF đầy đủ đã có sẵn glyph tiếng Việt (`inferred`; cách dùng TTF đầy đủ chưa chạy thử).
- **Result / gate:** mở PNG kiểm bằng mắt, không còn ô vuông nào trong tiêu đề. Chưa có gate tự động.
  Có thể thêm một test so kích thước PNG hoặc kiểm tra font không thiếu glyph (`inferred`).

## 4. Phương án B — astro-og-canvas

> Một package dựng sẵn: khai báo `pages` và một hàm trả về tuỳ chọn (tiêu đề, mô tả, logo, màu nền,
> viền, font), nó sinh `getStaticPaths` và `GET` cho endpoint ảnh.

- **Intro:** sinh ảnh OG với bố cục cố định (logo, tiêu đề, mô tả) bằng CanvasKit.
- **Purpose:** ít code hơn phương án A, đổi lại bố cục chỉ chỉnh được qua các tuỳ chọn có sẵn.
- **Input:**
  - `astro-og-canvas` 0.13.2, peer `astro ^5.0.0||^6.0.0||^7.0.0` (`ran`: `npm view`), nên chạy được
    với Astro 7.3.5 của dự án.
  - Với pnpm: "`pnpm` users will also need to install `canvaskit-wasm` as a direct dependency" (`docs`).
  - Font: `fonts?: string[]` là "Array of font URLs or file paths"; `families` hoạt động như font
    stack: "The first family in the list will be preferred with next entries used if a glyph isn't in
    earlier families" (`docs`). Có hỗ trợ file WOFF hay chỉ TTF là `verify`.
    Cách kiểm: sinh một ảnh với file `.woff` của fontsource và xem log build.
  - Tuỳ chọn có sẵn: `title`, `description`, `dir`, `logo`, `bgGradient`, `border`, `bgImage`,
    `padding` (mặc định 60), `font.title`/`font.description` (cỡ mặc định 70/40), `cacheDir` (mặc định
    `./node_modules/.astro-og-canvas`) (`docs`).
- **Output:** đường dẫn ảnh do key của `pages` quyết định, ví dụ `/open-graph/example.png` (`docs`).
- **What it does:** chưa chạy thử trong dự án này (`unknown`: thời gian build, dung lượng ảnh, cách
  hiển thị tiếng Việt).
- **Result / gate:** như phương án A.

## 5. Phương án không chọn

- **@vercel/og** 1.0.3, `engines.node >=22` (`ran`: `npm view`): lớp bọc satori + resvg theo kiểu
  `ImageResponse`, thiết kế cho serverless/edge function. Site này là static, không có runtime server
  (`inferred`). Dùng thẳng satori (phương án A) bỏ được một lớp phụ thuộc.
- **sharp vẽ chữ trong SVG:** dự án đã có `sharp` 0.35.4 (dùng cho `scripts/build-brand.mjs`). Nhưng
  khi sharp render thẻ `<text>` trong SVG thì font lấy từ máy đang build (fontconfig), không phải font
  đi kèm repo, nên ảnh có thể khác nhau giữa máy dev và CI; tự xuống dòng tiêu đề dài cũng phải viết
  tay (`inferred`, chưa chạy).

## 6. Nút chia sẻ trên trang chi tiết

> Nên có: một nút "Chia sẻ" gọi Web Share API khi trình duyệt hỗ trợ; khi không hỗ trợ thì mở menu
> gồm "Copy link", X, Facebook, LinkedIn. Nút Zalo chính thức cần script SDK và (theo các nguồn thứ
> cấp) một Official Account.

- **Intro:** cho người đọc gửi link bài sang nền tảng khác mà không phải tự copy URL.
- **Purpose:** yêu cầu của chủ site: "để sau còn share bài viết trên các nền tảng".
- **Input:** URL tuyệt đối của trang (cần `site`, xem đầu file), tiêu đề bài.
- **Output:** một cụm nút trong header hoặc cuối bài ở trang chi tiết (`inferred`, chưa chọn vị trí).
- **What it does:**
  - **Web Share API** (`navigator.share`): cần "Secure context (HTTPS)" và "Transient activation",
    tức phải gọi từ một cú bấm của người dùng; nhận `url`, `text`, `title`, `files`; khi người dùng
    huỷ thì ném `AbortError`, bị policy chặn thì ném `NotAllowedError` (`docs`, MDN). MDN ghi
    "Limited availability", phải kiểm tra tính năng trước khi dùng (`docs`). Trên điện thoại, hộp thoại
    chia sẻ của hệ điều hành liệt kê các app đã cài, có thể gồm Zalo và Messenger; điều này chưa kiểm
    (`verify`: mở trang trên Android/iOS có cài Zalo, bấm nút, xem Zalo có trong danh sách không).
  - **Copy link:** dùng lại `writeClipboard` đã có trong `src/app/copy.ts` (`inferred`).
  - **Link chia sẻ của từng nền tảng** (mở tab mới, không cần SDK):
    - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=<URL>`; "If only the URL is
      provided, LinkedIn will pull in the "og:title" and "og:description"" (nguồn thứ cấp:
      CSS-Tricks; `verify` trên tài liệu Microsoft Learn "Share on LinkedIn").
    - Facebook: `https://www.facebook.com/sharer/sharer.php?u=<URL>` (`verify` — không có trong hai
      trang tài liệu Facebook đã đọc). Cách kiểm: mở URL này khi đã đăng nhập Facebook, xem hộp thoại.
    - X: `https://x.com/intent/post?url=<URL>&text=<tiêu đề>` hoặc dạng cũ
      `https://twitter.com/intent/tweet?url=…&text=…` (`verify` — không truy cập được tài liệu của X).
      Cách kiểm: mở cả hai URL, xem cái nào mở ô soạn bài với đúng link.
  - **Zalo:** nút chính thức dùng script `https://sp.zalo.me/plugins/sdk.js` và phần tử
    `<div class="zalo-share-button" data-href="…" data-oaid="…" …>`; các nguồn thứ cấp nói cần có Zalo
    Official Account để lấy `data-oaid` (`verify` — trang tài liệu Zalo render bằng JS, không đọc
    được). Nhúng script này nghĩa là tải script của bên thứ ba lên mọi trang chi tiết (`inferred`).
- **Result / gate:** bấm từng nút trên trang đã deploy, thẻ xem trước hiện đúng ảnh ở mục 3 hoặc 4.

## Findings

1. Chưa có `site` trong `astro.config.ts` và chưa có thẻ OG, twitter hay canonical nào. Chia sẻ link
   lúc này sẽ không có ảnh, tiêu đề lấy theo `<title>`, còn mô tả tuỳ từng nền tảng. (`ran`)
2. Dùng font fontsource với satori thì các subset **phải được đăng ký dưới tên khác nhau** và khai báo
   thành font stack. Nếu cùng tên, ảnh mất các chữ có dấu tiếng Việt mà build không báo lỗi gì. (`ran`)
3. Phương án A (satori + resvg) đã chạy được tiếng Việt trong sandbox, khoảng 150 ms mỗi ảnh. Với số
   bài hiện tại (7 trang), thời gian build tăng không đáng kể. (`ran` / `inferred`)
4. astro-og-canvas hỗ trợ Astro 7 (peer `^7.0.0`) nhưng chưa được thử với tiếng Việt, và với pnpm
   phải cài thêm `canvaskit-wasm`. (`ran` / `docs`)
5. Web Share API chỉ chạy trên HTTPS và phải được gọi từ một cú bấm; vẫn cần menu dự phòng cho trình
   duyệt không hỗ trợ. (`docs`)
6. Nút Zalo chính thức có thể cần Official Account và script bên thứ ba. Trên điện thoại, Web Share
   API có thể đã đưa được link sang Zalo mà không cần các thứ đó. Cả hai điều này đều chưa kiểm.
   (`verify`)
7. Không đọc được tài liệu chính thức của X (402/404). Mọi thông số về X trong file này là `verify`.

## Numbers

| Số | Nguồn | Ngày | Nhãn |
|---|---|---|---|
| satori 0.33.5, node ≥16 | `npm view satori version engines.node` | 2026-09-25 | ran |
| @resvg/resvg-js 2.6.2 | `npm view` | 2026-09-25 | ran |
| astro-og-canvas 0.13.2, peer astro ^5‖^6‖^7 | `npm view` | 2026-09-25 | ran |
| @vercel/og 1.0.3, node ≥22 | `npm view` | 2026-09-25 | ran |
| Render lần đầu 1165 ms, 24887 byte (subset vietnamese, sai glyph) | `node render.mjs vietnamese` | 2026-09-25 | ran |
| Render 150 ms, 26872 byte (3 subset cùng tên, thiếu glyph có dấu) | `node render.mjs latin,latin-ext,vietnamese` | 2026-09-25 | ran |
| Render 157 ms, 27966 byte (3 subset tên riêng, đủ glyph) | `node render.mjs latin,latin-ext,vietnamese distinct` | 2026-09-25 | ran |
| LinkedIn: tối thiểu 1200×627, tối đa 5 MB, tỉ lệ 1,91:1 | LinkedIn help a521928 | 2026-09-25 | docs |
| Facebook: ≥1080px chiều rộng, tối thiểu 600px | Facebook sharing best-practices | 2026-09-25 | docs |
| X: 300×157 → 4096×4096, < 5 MB, 2:1 | các bài tổng hợp trên web | 2026-09-25 | verify |
| Cắt 15px mỗi cạnh khi X hiển thị ảnh 1200×630 theo 2:1 | (630 − 1200/2) / 2 | 2026-09-25 | inferred |
| Trang được build: 7 | `pnpm build` ("7 page(s) built") | 2026-09-25 | ran |

## Still to do

| Người làm | Việc | Vì sao đang chặn |
|---|---|---|
| Chủ site | Chọn phương án A hay B (đề xuất A) | Quyết định file endpoint và dependency cần thêm |
| Chủ site | Xác nhận domain production `https://trungnttb.dev` và nơi deploy | `site` và mọi URL tuyệt đối phụ thuộc vào đây |
| Nobody yet | Thêm `site`, canonical và bộ thẻ OG ở mục 1 vào `src/layouts/Base.astro` | Bước này cần có trước khi ảnh OG có tác dụng |
| Nobody yet | Kiểm các mục `verify` về X, Facebook sharer, LinkedIn share-offsite bằng URL đã deploy | Tránh làm link chia sẻ bị lỗi |
| Chủ site | Có Zalo Official Account không; có muốn nhúng SDK Zalo không | Quyết định có nút Zalo riêng hay chỉ dùng Web Share API |
| Nobody yet | Thử Web Share API trên điện thoại có cài Zalo | Nếu Zalo có trong hộp thoại chia sẻ thì không cần SDK Zalo |
| Nobody yet | Chạy thử phương án B với tiếng Việt, nếu chủ site muốn so sánh | Hiện chưa có số liệu nào của B trong dự án |
