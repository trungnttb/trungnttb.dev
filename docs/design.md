# Portfolio — thiết kế

Trạng thái: **đã chốt hướng cho cả 3 phần** · cập nhật 2026-09-25
Đã scaffold (Astro 7.3.5, Tailwind 4.3.3, pnpm 12.6.0), `pnpm build` chạy qua. Chưa có code tính năng. Làm theo thứ tự ở mục 3, bắt đầu từ phần 1.

## 1. Yêu cầu gốc (tóm tắt)

- **Stack:** Astro, TailwindCSS, Three.js, Shiki.
- **Trang chủ:** một màn hình 3D fullscreen. Lập trình viên ngồi trước bàn, trên bàn có MacBook và cốc cafe. Tham khảo `div.voxel-dog` trên https://www.craftz.dog/.
- **Ánh sáng theo giờ của máy người xem**, gồm 4 mức: sáng sớm, buổi sáng, buổi chiều, buổi tối. Từ 18h chuyển sang tối.
- Có dòng hướng dẫn scroll xuống để đi tiếp.
- **Scroll xuống:** camera zoom dần vào màn hình laptop rồi hiện giao diện CLI.
- **Phím `~`:** bấm lần 1 thì zoom thẳng vào CLI, bấm lần 2 thì quay lại trang chủ.
- **CLI:** theme tối màu cafe. Dòng đầu liệt kê các lệnh `/help /me /projects /posts /notes`.
  - `/help`: mỗi lệnh một dòng, kèm hướng dẫn.
  - `/me`: lời chào, tên, nghề nghiệp, bio và vài chia sẻ.
  - `/projects`: danh sách các project đã làm.
  - `/posts`: mở modal fullscreen cùng theme. Trên cùng là ô search, bên dưới là danh sách kiểu Finder của macOS. Bấm vào một bài thì mở trang chi tiết.
- **Code block:** tô màu bằng Shiki, có nút copy.

## 2. Đã kiểm tra gì ở craftz.dog

Nguồn: `components/voxel-dog.js` trong repo `craftzdog/craftzdog-homepage`, cùng `curl -I` lên file model. Đã chạy ngày 2026-09-25.

- Model là file `dog.glb` dựng sẵn, **143.672 byte**, load bằng `GLTFLoader`. Không dựng bằng code Three.js.
- Camera là `OrthographicCamera`. `OrbitControls` bật `autoRotate`. Lúc mở trang camera quay một vòng intro, dùng easing `easeOutCirc`.
- Chỉ có **một `AmbientLight`**: không có đèn hướng, không có bóng.

Rút ra từ các điểm trên, chưa kiểm chứng thêm:
- Source không cho biết `dog.glb` làm bằng tool nào. Chưa kiểm tra.
- Chỉ có ambient light thì không làm được hiệu ứng theo giờ. Cần thêm `DirectionalLight` đổi góc và màu theo từng mức, bật shadow, và phải có mặt bàn hứng sáng thì người xem mới thấy khác biệt.

## 3. Chia phần và thứ tự làm

1. **CLI + nội dung:** Astro content collections, các lệnh, modal Finder, Shiki kèm nút copy. Phần này chạy được khi chưa có 3D. Nó cũng là bản dự phòng cho máy yếu và cho người bật `prefers-reduced-motion`.
2. **Scene 3D + ánh sáng theo giờ.**
3. **Chuyển cảnh:** scroll-zoom và phím `~`, nối phần 1 với phần 2.

## 4. Quyết định đã chốt

### D1 — Cách làm model 3D

- **Bối cảnh:** cần một mô hình người, bàn, MacBook và cốc cafe. Câu hỏi đặt ra là có bắt buộc dùng Blender không.
- **Các phương án đã xem:**
  - A. Voxel vẽ bằng MagicaVoxel: cùng phong cách craftz.dog, học tool khoảng 1 giờ. Tool xuất `.obj`/`.vox` nên phải chuyển sang `.glb`, bằng `obj2gltf` hoặc mở Blender chỉ để export.
  - B. Dựng bằng code, dùng `BoxGeometry`/`InstancedMesh` đọc từ một mảng voxel: không cần tool ngoài. Bàn, laptop, cốc làm nhanh; người ngồi khó làm cho tự nhiên, mỗi lần đổi dáng phải sửa số.
  - C. Blender low-poly, hoặc asset có sẵn trên Sketchfab: tự làm thì tốn công học nhất; lấy asset thì phải kiểm tra license và dung lượng file.
- **Chọn: B rồi chuyển sang A.** Giai đoạn đầu dựng tạm bằng code để làm camera, zoom và ánh sáng. Sau đó vẽ bản chính bằng MagicaVoxel, xuất `.glb` và thay vào. Cách này không bắt phần code phải chờ model.
- **Blender:** không bắt buộc. Chỉ có thể cần tới nó như một bước chuyển đổi định dạng.
- **Xem lại khi:** người trong bản voxel trông không đạt, lúc đó cân nhắc phương án C.

### D2 — Màn hình CLI render bằng gì

- **Bối cảnh:** khi zoom vào laptop, CLI phải gõ được lệnh, bôi đen và copy được, có ô search, và hiển thị được code block của Shiki.
- **Các phương án đã xem:**
  - DOM đè lên canvas: camera zoom tới khi `Screen` lấp đầy khung hình, rồi fade sang terminal HTML thật. Mọi thứ trên hoạt động bình thường. Nhược điểm là có một cú fade khoảng 200–300ms.
  - DOM, thêm ảnh chụp tĩnh của terminal làm texture cho `Screen`: cú fade gần như không nhận ra. Tốn thêm một file ảnh và một bước cập nhật ảnh mỗi lần đổi giao diện. Có thể thêm sau mà không phải đổi kiến trúc.
  - `CSS3DRenderer`: chuyển cảnh liền mạch thật. Nhưng DOM không bị các vật 3D che, và chữ mờ khi bị scale. Khó làm nhất.
  - Texture vẽ bằng WebGL: không gõ phím thật, không copy được, không dùng được Shiki. Loại.
- **Chọn: DOM đè lên canvas.** Chỉ cách này đáp ứng được yêu cầu copy, search và Shiki mà không phải tự viết lại những thứ trình duyệt đã có sẵn.
- **Xem lại khi:** người xem thấy rõ bị ngắt quãng lúc chuyển từ cảnh 3D sang CLI. Khi đó thêm ảnh chụp làm texture cho `Screen`.

### D3 — `/posts` và `/notes`

- **Bối cảnh:** yêu cầu gốc có lệnh `/notes` nhưng chưa mô tả.
- **Chốt (người dùng trả lời 2026-09-25):** hai lệnh dùng cùng một giao diện: modal Finder, ô search, trang chi tiết, Shiki và nút copy. Chỉ khác thư mục nguồn và loại nội dung:
  - `posts`: bài viết dài, nằm ở `src/content/posts/`.
  - `notes`: đoạn script hoặc code ngắn, chạy độc lập được, lưu lại để tra cứu khi cần. Nằm ở `src/content/notes/`.
- **Hệ quả:** code modal và code trang chi tiết viết một lần rồi nhận collection làm tham số. Hai collection có schema riêng. Ví dụ, note có trường ngôn ngữ của đoạn code; post có trường tóm tắt.
- **Xem lại khi:** note bắt đầu cần cách hiển thị khác hẳn post, ví dụ trang chi tiết chỉ gồm một khối code để copy nhanh.

### D4 — Phiên bản thư viện

- **Yêu cầu (người dùng, 2026-09-25):** mọi thư viện đều dùng bản LTS mới nhất.
- **Thực tế:** trong stack này chỉ **Node.js** phát hành theo kênh LTS. Astro, Tailwind, Three.js và Shiki không có kênh LTS. Với chúng, "mới nhất" nghĩa là tag `latest` trên npm, tức bản stable, không dùng `alpha`, `beta`, `rc` hay `next`. Riêng Tailwind có tag `v3-lts` (3.4.19), đây là nhánh cũ đang được bảo trì, không phải bản mới nhất, nên **không dùng**.
- **Số liệu tại thời điểm brainstorm** (lấy bằng `npm view <pkg> dist-tags` và `nodejs.org/dist/index.json`, ngày 2026-09-25):

| Gói | Bản dùng | Ghi chú |
|---|---|---|
| pnpm | 12.6.0 | package manager (người dùng chọn, 2026-09-25). Máy hiện tại đang chạy 12.3.4. Ghi vào trường `packageManager` trong `package.json` |
| Node.js | 24.x LTS "Krypton" (mới nhất: 24.21.0) | bản mới nhất nói chung là 26.10.0, chưa phải LTS. Máy hiện tại đang chạy 24.12.0 |
| astro | 7.3.5 | yêu cầu `node >=22.12.0` |
| @astrojs/mdx | 8.0.2 | peer `astro ^7.2.10`; chỉ cài nếu bài viết cần MDX |
| tailwindcss + @tailwindcss/vite | 4.3.3 | người dùng chỉ định giữ Tailwind ở các bản **4.3.x** (2026-09-25). Khi Tailwind ra 4.4 thì hỏi người dùng trước khi nâng cấp |
| three | 0.186.1 | |
| shiki | 4.4.3 | astro 7.3.5 phụ thuộc `shiki ^4.0.2`, nên chỉ có một bản shiki trong dự án |

- **Cách áp dụng:** cài bằng `pnpm add <pkg>@latest` (Tailwind thì `@~4.3`), ghi `.nvmrc` = `24`, commit lockfile. Nâng cấp khi có major mới thì làm thành một việc riêng, không gộp chung với việc thêm tính năng.
- **Xem lại khi:** Node 26 lên LTS (dự kiến tháng 10 theo lịch phát hành của Node, chưa kiểm tra ngày cụ thể).

### D5 — Cách người xem dùng CLI

- **Chốt (người dùng trả lời 2026-09-25):** làm cả hai cách.
  - Gõ lệnh vào dòng nhập rồi nhấn Enter.
  - Bấm vào một lệnh ở dòng đầu. Kết quả giống hệt gõ lệnh đó rồi nhấn Enter: lệnh được in vào lịch sử như vừa gõ.
- **Gõ sai lệnh:** in ra một dòng báo lỗi giống terminal thật, ví dụ `command not found: /foo`, kèm gợi ý gõ `/help`. Nội dung câu báo lỗi để trong file i18n, không viết thẳng trong code.
- **Hệ quả:** chỉ có một hàm chạy lệnh. Cả ô nhập lẫn thao tác bấm đều gọi hàm này.

### D6 — Trang chi tiết có URL riêng

- **Chốt (người dùng trả lời 2026-09-25):** có.
- **Các URL:**
  - `/`: màn 3D. Scroll xuống hoặc bấm `~` thì vào CLI.
  - `/posts/<slug>`, `/notes/<slug>`: trang chi tiết, sinh tĩnh lúc build bằng `getStaticPaths`.
- **Đang ở trong CLI và mở một bài:** URL đổi sang trang của bài đó, và nút Back của trình duyệt quay lại danh sách trong modal.
- **Mở thẳng link của bài** (người khác gửi, hoặc từ Google): hiện CLI với bài đó mở sẵn. Không tải Three.js, không chạy màn 3D.
- **Đóng bài khi đã mở thẳng link:** về CLI, URL đổi thành `/`. Tải lại trang lúc này sẽ ra màn 3D. Đây là mặc định mình chọn; muốn khác thì đổi.
- **Xem lại khi:** muốn giữ trạng thái đang ở CLI sau khi tải lại trang. Lúc đó thêm một URL riêng cho CLI.

### D7 — Ánh sáng theo giờ

- **Chốt (người dùng trả lời 2026-09-25):** chuyển dần.
- **Mốc giờ** (theo đồng hồ máy người xem): 05–07 sáng sớm, 07–12 buổi sáng, 12–18 buổi chiều, 18–05 buổi tối.
- Mỗi mức có một bộ thông số ánh sáng: màu, cường độ và góc chiếu của `DirectionalLight`, cùng màu và cường độ của ambient light.
- Trong 30 phút quanh mỗi mốc giờ (15 phút trước, 15 phút sau), các thông số được nội suy từ bộ của mức cũ sang bộ của mức mới. Ví dụ ở mốc 18:00, việc chuyển bắt đầu lúc 17:45 và xong lúc 18:15.
- Trang tính lại ánh sáng mỗi phút, nên để tab mở qua mốc giờ thì cảnh vẫn tự đổi.
- **Xem lại khi:** muốn ánh sáng theo giờ mặt trời mọc và lặn thực tế ở nơi người xem. Cách đó cần vị trí địa lý, nên phải xin quyền hoặc tra từ IP.

### D8 — Chuyển giữa màn 3D và CLI

- **Chốt (người dùng trả lời 2026-09-25):** có một nút `~` nổi ở góc màn hình, và trên điện thoại vuốt được.
- **Desktop:** scroll xuống thì zoom dần vào màn hình laptop. Bấm phím `~` thì zoom thẳng vào CLI; bấm `~` lần nữa thì quay lại màn 3D.
- **Điện thoại:** vuốt lên ở màn 3D chạy cùng đoạn animation zoom như scroll trên desktop.
- **Nút `~` nổi:** hiện trên cả desktop lẫn điện thoại. Bấm nút có tác dụng giống bấm phím `~`, đồng thời cho người dùng desktop biết có phím tắt này.
- Scroll, vuốt, phím `~` và nút `~` đều gọi cùng một hàm zoom.
- **Phím `~` khi đang gõ lệnh** (người dùng trả lời 2026-09-25): nhấn `~` ở đâu cũng chuyển cảnh, kể cả khi ô nhập của CLI đang được focus. Vì vậy không gõ được ký tự `~` vào ô nhập. Hiện không có lệnh nào cần ký tự này.
- **Xem lại khi:**
  - có lệnh cần gõ ký tự `~`: lúc đó chỉ cho `~` chuyển cảnh khi ô nhập đang trống.
  - vuốt trên điện thoại bị giật, hoặc bị nhầm với thao tác cuộn trang: lúc đó trên điện thoại chỉ giữ nút `~`.

## 5. Quy ước giữa code và file model

Code camera, zoom và ánh sáng chỉ làm việc với các node có tên cố định dưới đây. Nhờ vậy, đổi model tạm bằng code sang file `.glb` chỉ là thay file.

| Node | Dùng để |
|---|---|
| `Screen` | mặt phẳng màn hình laptop: vị trí, hướng pháp tuyến và kích thước là đích để camera zoom tới |
| `Mug` | cốc cafe, có thể gắn hiệu ứng hơi nước |
| `Desk` | mặt bàn, nhận shadow |

Người ngồi không cần node riêng, trừ khi sau này làm animation cho người.

## 6. Câu hỏi còn mở

Không còn câu nào. Q1–Q6 đã chốt thành D3, D5, D6, D7 và D8.

## 7. Chưa làm

- Chưa đo dung lượng bundle Three.js và chưa quyết định lazy-load thế nào.
- Chưa có nội dung thật cho `/me`, `/projects` và các bài viết.
