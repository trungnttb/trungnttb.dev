# Đưa site lên GitHub Pages với domain trungnttb.dev

Hướng dẫn làm một lần từ đầu: tạo repo, bật GitHub Pages, trỏ domain `trungnttb.dev` (DNS đang ở
Cloudflare) và bật HTTPS. Sau lần đầu, mỗi lần push lên `main` là site tự deploy.

> Cập nhật 2026-09-26. IP, tên bản ghi và thời gian chờ lấy từ tài liệu GitHub (link ở cuối). Trạng
> thái DNS lúc viết (kiểm bằng `dig`): nameserver là `erin.ns.cloudflare.com` và
> `keaton.ns.cloudflare.com`, chưa có bản ghi A, AAAA, CAA hay `www` nào.

## Tổng quan các bước

| # | Làm ở đâu | Việc |
|---|---|---|
| 1 | Máy của bạn | Đăng nhập GitHub CLI |
| 2 | Máy của bạn | Tạo repo và push code |
| 3 | GitHub, repo → Settings → Pages | Chọn Source là "GitHub Actions" |
| 4 | GitHub | Chờ lần deploy đầu, site chạy ở địa chỉ `*.github.io` |
| 5 | GitHub, Settings của tài khoản | Xác minh domain (chống bị chiếm domain) |
| 6 | GitHub, repo → Settings → Pages | Điền custom domain `trungnttb.dev` |
| 7 | Cloudflare | Tạo bản ghi DNS, để chế độ DNS only |
| 8 | GitHub | Chờ chứng chỉ HTTPS, bật Enforce HTTPS |
| 9 | Trình duyệt | Kiểm tra site, ảnh xem trước khi chia sẻ link |

## 1. Đăng nhập GitHub CLI

```sh
gh auth login
```

Chọn `GitHub.com`, giao thức `SSH` hoặc `HTTPS`, rồi đăng nhập qua trình duyệt. Kiểm tra lại:

```sh
gh auth status
```

## 2. Tạo repo và push code

Repo đang có sẵn lịch sử commit trên branch `main`. Tạo repo trên GitHub và push lên trong một lệnh
(tên repo tuỳ bạn; ví dụ dưới dùng `trungnttb.dev`):

```sh
cd ~/workspace/mine/portfolio
gh repo create trungnttb.dev --public --source . --remote origin --push
```

Không dùng `gh` thì tạo repo trống trên github.com (không tick README, .gitignore hay license, vì repo
local đã có sẵn), rồi:

```sh
git remote add origin git@github.com:trungnttb/trungnttb.dev.git
git push -u origin main
```

Repo phải để **public**, trừ khi tài khoản có gói trả phí hỗ trợ GitHub Pages cho repo private.

## 3. Bật GitHub Pages bằng GitHub Actions

Trên GitHub: repo → **Settings** → **Pages** → mục **Build and deployment** → **Source** chọn
**GitHub Actions**.

Không cần tạo workflow mới: repo đã có `.github/workflows/deploy.yml`. Workflow này chạy mỗi lần push
lên `main`, gồm hai job:

- `build`: `withastro/action@v6` cài Node 24 và đúng version pnpm ghi trong `package.json`, chạy
  `pnpm test && pnpm build`, rồi upload thư mục `dist/`. Test fail thì dừng tại đây, không deploy.
- `deploy`: `actions/deploy-pages@v5` đưa bản build lên GitHub Pages.

## 4. Chờ lần deploy đầu tiên

Vào tab **Actions** của repo, mở run "Deploy to GitHub Pages". Nếu run chạy trước khi bạn chọn Source
ở bước 3 và bị lỗi, bấm **Re-run all jobs**. Có thể chạy lại bằng tay bất cứ lúc nào: tab Actions →
workflow → **Run workflow** (workflow có `workflow_dispatch`).

Khi run xanh, site chạy ở `https://trungnttb.github.io/trungnttb.dev/`. Ở địa chỉ tạm này, link tới
file CSS/JS có thể bị lỗi, vì site được build cho đường dẫn gốc `/` của `trungnttb.dev`. Không cần
sửa gì, vì bước 6 sẽ đưa site về đúng domain.

## 5. Xác minh domain

Làm bước này **trước** khi trỏ DNS. Theo GitHub, xác minh giúp tránh domain takeover: người khác gắn
domain của bạn vào repo của họ trong lúc GitHub Pages của bạn đang tắt hoặc repo vừa bị xoá.

1. GitHub → ảnh đại diện → **Settings** (của tài khoản, không phải của repo) → **Pages** →
   **Add a domain** → nhập `trungnttb.dev`.
2. GitHub hiện một bản ghi TXT, tên có dạng `_github-pages-challenge-trungnttb.trungnttb.dev`, kèm
   một giá trị riêng cho tài khoản của bạn.
3. Trên Cloudflare: **DNS** → **Records** → **Add record** → Type `TXT`, Name
   `_github-pages-challenge-trungnttb`, Content là giá trị GitHub đưa → **Save**.
4. Kiểm tra bản ghi đã có hiệu lực:

   ```sh
   dig _github-pages-challenge-trungnttb.trungnttb.dev +short -t TXT
   ```

5. Quay lại GitHub, bấm **Verify**. GitHub ghi DNS có thể cập nhật ngay, hoặc mất tới 24 giờ.

## 6. Điền custom domain cho repo

Repo → **Settings** → **Pages** → **Custom domain** → nhập `trungnttb.dev` → **Save**.

Repo này **không có** file `public/CNAME`, và cũng không cần. GitHub ghi rằng khi deploy bằng GitHub
Actions thì file CNAME bị bỏ qua; domain chỉ lấy từ ô Custom domain ở đây.

`site` trong `astro.config.ts` đã là `https://trungnttb.dev`, và không khai báo `base`. Vì vậy canonical,
thẻ OG và link tới asset đều trỏ đúng domain gốc.

## 7. Tạo bản ghi DNS trên Cloudflare

Cloudflare → chọn domain `trungnttb.dev` → **DNS** → **Records** → **Add record**. Tạo 4 bản ghi A và
4 bản ghi AAAA cho domain gốc (Name là `@`), cộng một CNAME cho `www`:

| Type | Name | Content | Proxy status |
|---|---|---|---|
| A | `@` | `185.199.108.153` | DNS only |
| A | `@` | `185.199.109.153` | DNS only |
| A | `@` | `185.199.110.153` | DNS only |
| A | `@` | `185.199.111.153` | DNS only |
| AAAA | `@` | `2606:50c0:8000::153` | DNS only |
| AAAA | `@` | `2606:50c0:8001::153` | DNS only |
| AAAA | `@` | `2606:50c0:8002::153` | DNS only |
| AAAA | `@` | `2606:50c0:8003::153` | DNS only |
| CNAME | `www` | `trungnttb.github.io` | DNS only |

**Proxy status phải là DNS only** (biểu tượng đám mây xám). Nếu bật Proxied (đám mây cam), request
đi qua Cloudflare trước, nên GitHub không kiểm tra được domain và không xin được chứng chỉ Let's
Encrypt. Điểm này đến từ các bài hướng dẫn cộng đồng (link ở cuối), tài liệu GitHub không nhắc tới
Cloudflare. Nếu sau này muốn bật proxy để dùng cache của Cloudflare, chỉ bật khi HTTPS đã chạy, và đặt
**SSL/TLS encryption mode** là **Full** hoặc **Full (strict)** để không bị redirect vòng lặp.

Khi cả domain gốc và `www` đều trỏ đúng, GitHub tự redirect `www.trungnttb.dev` về `trungnttb.dev`,
vì domain điền ở bước 6 là domain gốc.

Không tạo bản ghi wildcard `*.trungnttb.dev`: GitHub ghi rằng bản ghi này làm tăng nguy cơ bị chiếm
subdomain, kể cả khi domain đã được xác minh.

Nếu domain có bản ghi CAA, phải có ít nhất một bản ghi CAA cho `letsencrypt.org`, nếu không GitHub
không cấp được HTTPS. Lúc viết hướng dẫn này, domain chưa có bản ghi CAA nào, nên không cần làm gì.

### Kiểm tra DNS

```sh
dig trungnttb.dev +noall +answer -t A
dig trungnttb.dev +noall +answer -t AAAA
dig www.trungnttb.dev +nostats +nocomments +nocmd
```

Kết quả đúng: lệnh A ra đủ 4 IP `185.199.108.153` … `185.199.111.153`; lệnh AAAA ra đủ 4 địa chỉ
`2606:50c0:800X::153`; `www` ra một dòng CNAME trỏ tới `trungnttb.github.io.`. Nếu vẫn ra IP của
Cloudflare (thường bắt đầu bằng `104.` hoặc `172.`) thì bản ghi đó vẫn đang ở chế độ Proxied.

## 8. HTTPS

Đuôi `.dev` nằm trong danh sách HSTS preload của các trình duyệt, nên trình duyệt **chỉ mở
`trungnttb.dev` qua HTTPS**. Trước khi GitHub cấp xong chứng chỉ, trình duyệt sẽ báo lỗi. Đây là
bình thường trong lúc chờ, không phải lỗi cấu hình.

1. Sau khi DNS đúng, GitHub tự xin chứng chỉ từ Let's Encrypt. Repo → **Settings** → **Pages** hiện
   dấu tick cạnh domain khi xong. GitHub ghi có thể mất tới một giờ.
2. Nếu vài phút sau khi bấm Save mà vẫn chưa xong, bấm **Remove** cạnh custom domain, nhập lại
   `trungnttb.dev` và **Save** để GitHub chạy lại từ đầu. Làm tương tự sau mỗi lần sửa DNS.
3. Khi đã có chứng chỉ, tick **Enforce HTTPS**. Tuỳ chọn này có thể mất tới 24 giờ mới bấm được.

## 9. Kiểm tra sau khi lên mạng

```sh
curl -sI https://trungnttb.dev | head -1                      # mong đợi: HTTP/2 200
curl -sI https://www.trungnttb.dev | grep -i '^location'      # mong đợi: redirect về https://trungnttb.dev/
curl -s https://trungnttb.dev/og/site.png -o /tmp/og.png && file /tmp/og.png   # PNG 1200 x 630
```

Trên trình duyệt:

- Trang chủ hiện cảnh 3D; nhấn `` ` `` vào terminal; `/posts` mở Finder.
- Mở thẳng một link bài, ví dụ `https://trungnttb.dev/posts/hello-terminal/`.
- Dán link bài vào [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), ô soạn
  bài của X và LinkedIn, xem ảnh xem trước có hiện đúng không. Các link chia sẻ của X, Facebook và
  LinkedIn trong trang chưa được kiểm tra trên site thật; đây là lần kiểm tra đầu tiên.

## Deploy hằng ngày

```sh
git add -A
git commit -m "content: new post about …"
git push                 # workflow tự test, build và deploy
```

Theo dõi ở tab **Actions**. Run đỏ thì site vẫn giữ bản deploy thành công gần nhất. Xem log bước
`withastro/action` để biết test hay build nào lỗi, sửa ở máy, chạy `pnpm test && pnpm build` cho qua,
rồi push lại.

## Khi có lỗi

| Hiện tượng | Nguyên nhân hay gặp | Cách xử lý |
|---|---|---|
| Actions báo lỗi ở job `deploy` | Source của Pages chưa đặt là GitHub Actions | Làm lại bước 3, rồi Re-run |
| Job `build` lỗi ở bước cài package | `pnpm-lock.yaml` không khớp `package.json` | Chạy `pnpm install` ở máy, commit lockfile |
| Trình duyệt báo lỗi chứng chỉ | Chứng chỉ chưa cấp xong, hoặc bản ghi đang Proxied | Kiểm DNS (bước 7), Remove rồi Save lại domain (bước 8) |
| `dig` ra IP của Cloudflare | Bản ghi đang bật proxy (đám mây cam) | Đổi sang DNS only |
| Site mới deploy nhưng vẫn thấy bản cũ | Trình duyệt hoặc CDN còn cache | Tải lại bằng Cmd+Shift+R, hoặc chờ vài phút |
| Chia sẻ link vẫn hiện ảnh cũ | Nền tảng còn cache thẻ OG | Bấm "Scrape Again" trong Facebook Sharing Debugger |

## Nguồn

- GitHub Docs: [Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- GitHub Docs: [Verifying your custom domain for GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- GitHub Docs: [Securing your GitHub Pages site with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- GitHub Docs: [Troubleshooting custom domains and GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages)
- Astro Docs: [Deploy your Astro site to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
- Cloudflare và GitHub Pages (hướng dẫn cộng đồng): [Simon Richardson](https://simonrichardson.dev/writing/custom-domain-github-pages/), [Let's Encrypt Community](https://community.letsencrypt.org/t/github-pages-cloudflare-custom-domain/77841)
- `.dev` và HSTS preload: [Wikipedia: .dev](https://en.wikipedia.org/wiki/.dev)
