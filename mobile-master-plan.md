# Finance Tracker - Mobile Master Plan

## Bối cảnh hiện tại
- Dự án đã có backend REST API ổn định cho auth, category, transaction, budget và reports.
- Web app đã có dashboard usable với auth flow, budget warning, charts, reports và CRUD cơ bản.
- Mobile app nên tận dụng lại API contract hiện có thay vì thiết kế như một sản phẩm tách rời.

## Mục tiêu chính
- Thiết kế một mobile app giúp người dùng kiểm tra tình trạng tài chính nhanh hơn web trong các tình huống hàng ngày.
- Ưu tiên thao tác một tay, ít bước, phản hồi rõ ràng và tốc độ hoàn thành tác vụ ngắn.
- Giữ phạm vi MVP tập trung để chuyển từ thiết kế sang Expo/React Native nhanh.

## Nguyên tắc sản phẩm cho mobile
- Mobile-first thay vì co nhỏ dashboard web.
- Mọi tác vụ quan trọng nên hoàn thành trong dưới 15 giây.
- Màn hình đầu tiên phải trả lời được ba câu hỏi: còn bao nhiêu tiền, đã chi bao nhiêu trong tháng, budget nào đang rủi ro.
- Hành động thêm giao dịch phải nằm gần vùng ngón tay cái và mở bằng bottom sheet.
- Báo cáo trên mobile chỉ giữ những biểu đồ thực sự đọc được trên màn hình nhỏ.
- Loading, empty, error và offline phải được xem là flow chính chứ không phải phụ.

## Người dùng mục tiêu
- Người đi làm theo dõi chi tiêu cá nhân theo tháng.
- Người muốn nhập giao dịch nhanh ngay sau khi chi tiêu.
- Người muốn biết category nào đang gần vượt ngân sách mà không cần mở dashboard web.

## Use case ưu tiên
1. Mở app để xem số dư và budget warning của tháng hiện tại.
2. Thêm một giao dịch income hoặc expense thật nhanh.
3. Kiểm tra giao dịch gần đây và sửa note hoặc category nếu nhập sai.
4. Theo dõi ngân sách theo category và chỉnh limit ngay trên điện thoại.
5. Xem báo cáo chi tiêu theo nhóm và xu hướng 6 tháng ở mức tóm tắt.

## Phạm vi Mobile MVP
- Auth: login, register, me, logout.
- Home: balance, income, expense, budget health, recent transactions, quick actions.
- Transactions: list, filter, create, edit, delete.
- Budgets: list, create, edit, delete, warning state.
- Reports: expense by category, income vs expense trend, bộ lọc kỳ.
- Profile: account info, notification setting cơ bản, sync, logout.

## Ngoài phạm vi Mobile MVP
- Import CSV hoặc Excel.
- Nhiều ví hoặc nhiều tài khoản.
- Mục tiêu tiết kiệm và challenge gamification.
- Phân tích nâng cao kiểu so sánh theo nhiều kỳ tùy ý.
- Đồng bộ offline hai chiều hoàn chỉnh.

## Kiến trúc thông tin đề xuất

### Tab bar chính
- Home
- Transactions
- Budgets
- Reports
- Profile

### Luồng phụ trợ
- Quick Add Transaction bottom sheet
- Transaction Filter bottom sheet
- Budget Create/Edit sheet
- Monthly Review modal hoặc screen
- Notification Preference screen

## Cấu trúc trải nghiệm đề xuất

### 1. Home
- Hero summary với balance tháng hiện tại.
- Hai card nhỏ cho tổng thu và tổng chi.
- Budget health banner ở vị trí cao.
- Quick actions: thêm giao dịch, thêm budget, đồng bộ.
- Danh sách 3 đến 5 giao dịch gần nhất.

### 2. Transactions
- Search bar.
- Segmented control cho income và expense.
- Filter sheet theo tháng, năm, category.
- Danh sách transaction dạng card hoặc list item.
- Swipe action cho edit và delete.

### 3. Budgets
- Mỗi budget là một card có progress, trạng thái và số tiền còn lại.
- Ưu tiên hiển thị exceeded và warning lên đầu danh sách.
- Có CTA tạo budget mới ngay trong màn hình.

### 4. Reports
- Chỉ giữ hai chart chính của web: chi tiêu theo category và xu hướng thu chi.
- Có chế độ xem theo tháng hiện tại và 6 tháng gần nhất.
- Có insight text ngắn thay cho bảng dữ liệu dày.

### 5. Profile
- Tài khoản hiện tại.
- Nguồn dữ liệu hoặc trạng thái đồng bộ.
- Notification toggle.
- Đăng xuất.

## Quyết định kỹ thuật khuyến nghị
- App mobile nên dùng Expo + React Native + TypeScript strict.
- Navigation nên dùng Expo Router để tổ chức auth flow và tab flow rõ ràng.
- Dùng TanStack Query để cache và invalidate dữ liệu từ backend.
- Dùng React Hook Form + Zod để giữ đồng nhất với web.
- Dùng expo-secure-store để lưu access token.
- Dùng NativeWind hoặc design token tương đương để tái sử dụng ngôn ngữ thị giác từ web.
- Dữ liệu tiền vẫn giữ nguyên quy ước backend: amount và limitAmount là string, không dùng float.
- Timezone vẫn lấy UTC ở API, chỉ format local trên mobile.

## Roadmap theo tuần

### Week 1 - Scope, audience và success metric

#### Mục tiêu
- Chốt mobile MVP bám theo backend và web app hiện tại.
- Xác định user scenario quan trọng nhất trên điện thoại.

#### Công việc
- Khóa feature list của mobile MVP.
- Chốt user persona và tình huống sử dụng chính.
- Chốt KPI hoặc success metric cho phiên bản đầu tiên.
- Xác định phần nào dùng lại từ web, phần nào thiết kế riêng cho mobile.

#### Đầu ra tuần
- Product brief cho mobile.
- Danh sách tính năng Must have và Nice to have.

#### Exit criteria
- Scope không còn mơ hồ.
- Có quyết định rõ về 5 tab chính và quick add flow.

### Week 2 - Information architecture và user flow

#### Mục tiêu
- Dựng khung điều hướng và luồng thao tác chính.

#### Công việc
- Vẽ sitemap mobile.
- Thiết kế auth flow, tab flow và flow mở từ push notification.
- Chốt vị trí FAB, sheet và filter pattern.
- Xác định các modal, sheet và deep link cần có.

#### Đầu ra tuần
- Information architecture hoàn chỉnh.
- User flow cho Home, Quick Add, Transactions, Budgets, Reports.

#### Exit criteria
- Có thể mô tả trọn vẹn đường đi từ mở app đến tạo giao dịch mới.
- Không còn xung đột navigation giữa tabs, sheets và details.

### Week 3 - Low-fi wireframe

#### Mục tiêu
- Kiểm tra logic layout trước khi làm high-fi.

#### Công việc
- Wireframe cho Welcome, Login, Register.
- Wireframe cho Home, Transactions, Budgets, Reports, Profile.
- Wireframe cho Quick Add Transaction, Transaction Filter và Budget Form.
- Chốt vùng ưu tiên hiển thị và hierarchy của từng màn.

#### Đầu ra tuần
- Bộ low-fi wireframe của toàn bộ flow MVP.

#### Exit criteria
- Từng màn đều có CTA chính rõ ràng.
- Layout usable trên iPhone tiêu chuẩn và Android cỡ trung.

### Week 4 - High-fi design system và màn hình cốt lõi

#### Mục tiêu
- Hoàn thiện visual language cho mobile app.

#### Công việc
- Xây color token, typography scale, spacing system, icon rule.
- Thiết kế high-fi cho Home, Quick Add, Transactions.
- Chốt component card, list item, stat block, progress bar, banner, sheet.
- Viết microcopy cho các CTA và trạng thái chính.

#### Đầu ra tuần
- Design system phiên bản 1.
- High-fi các flow sử dụng thường xuyên nhất.

#### Exit criteria
- Giao diện đủ tin cậy và nhất quán.
- Quick Add flow có thể prototype được.

### Week 5 - High-fi cho budgets, reports, profile và edge states

#### Mục tiêu
- Hoàn thiện phần còn lại của MVP và các trạng thái phụ.

#### Công việc
- Thiết kế Budgets screen, Budget Detail, Budget Form.
- Thiết kế Reports screen và view detail nếu cần.
- Thiết kế Profile, Settings, Notification Preference.
- Hoàn thiện loading, empty, error, offline, no-data và no-budget states.

#### Đầu ra tuần
- Full mobile UI kit cho MVP.
- Danh sách state đầy đủ để handoff.

#### Exit criteria
- Không còn màn hình cốt lõi nào thiếu state.
- Chart và dữ liệu tóm tắt vẫn đọc tốt trên màn nhỏ.

### Week 6 - Prototype và usability review

#### Mục tiêu
- Kiểm tra tính dễ dùng trước khi handoff sang dev.

#### Công việc
- Tạo prototype tương tác cho login, home, quick add, budgets và reports.
- Test nội bộ ít nhất 3 tình huống thực tế.
- Rà hierarchy, spacing, feedback và tốc độ thao tác.
- Chốt các motion hoặc transition thật cần thiết.

#### Đầu ra tuần
- Prototype đã được review.
- Danh sách chỉnh sửa UX vòng cuối.

#### Exit criteria
- Tạo giao dịch mới mượt và dễ hiểu.
- Người dùng nhìn thấy budget risk mà không cần học thêm.

### Week 7 - Dev handoff và technical mapping

#### Mục tiêu
- Làm cầu nối từ thiết kế sang implementation.

#### Công việc
- Mapping từng màn hình với endpoint backend.
- Xác định component shared và reusable state.
- Chốt prompt cho mobile UI/UX và mobile developer.
- Soạn danh sách asset, icon và token cho Expo app.

#### Đầu ra tuần
- Bộ handoff hoàn chỉnh.
- Technical notes cho auth, token storage, error handling và money format.

#### Exit criteria
- Dev có thể bắt đầu app mà không phải hỏi lại scope cơ bản.
- API contract dùng lại tối đa từ backend hiện tại.

### Week 8 - Expo foundation và MVP implementation kickoff

#### Mục tiêu
- Bắt đầu code với scope đã khóa.

#### Công việc
- Khởi tạo Expo app.
- Thiết lập Expo Router, TanStack Query, Secure Storage và form validation.
- Dựng auth flow, tab shell và Home screen.
- Kết nối API thật cho auth và dashboard summary.

#### Đầu ra tuần
- Mobile app skeleton chạy được.
- Có thể đăng nhập và xem Home data đầu tiên.

#### Exit criteria
- App chạy được trên simulator hoặc device.
- Có nền tảng vững để tiếp tục Transactions, Budgets và Reports.

#### Trạng thái hiện tại
- [x] Expo app đã được scaffold và dependency graph hợp lệ với Expo doctor.
- [x] Root providers đã có cho Query, Secure Store session, gesture và bottom sheet.
- [x] Auth scaffold, 5-tab shell và Home screen skeleton đã được dựng.
- [x] Kết nối API thật cho auth và dashboard summary.
- [x] Mở rộng API wiring sang Transactions và Budgets list tabs.
- [x] Quick Add Transaction bottom sheet trên Home đã nối API thật.
- [x] Budget create/edit/delete flow tren mobile da noi API that.
- [x] Mở rộng API wiring sang Reports detail.

## Checklist thực thi

### 1. Product scope
- [ ] Chốt mục tiêu của mobile app khác gì so với web dashboard.
- [ ] Chốt mobile MVP và danh sách tính năng ngoài phạm vi.
- [ ] Chốt 3 use case ưu tiên nhất cho người dùng hằng ngày.
- [ ] Chốt success metric cho phiên bản đầu tiên.

### 2. Information architecture
- [x] Chốt 5 tab chính: Home, Transactions, Budgets, Reports, Profile.
- [x] Chốt auth flow riêng trước khi vào tab app.
- [x] Chốt quick add transaction là bottom sheet hay full screen.
- [x] Chốt filter transaction là sheet, chip hay full screen.
- [ ] Chốt deep link cơ bản cho budget warning và notification.

### 3. UX flow
- [x] Có flow login.
- [x] Có flow register.
- [x] Có flow vào Home sau đăng nhập.
- [x] Có flow thêm transaction nhanh.
- [x] Có flow sửa và xóa transaction.
- [x] Có flow tạo và chỉnh budget.
- [x] Có flow mở Reports và đổi kỳ.
- [x] Có flow logout và refresh session.

### 4. Visual system
- [ ] Chốt color token cho balance, income, expense, warning và neutral.
- [ ] Chốt typography scale cho heading, body, caption và number emphasis.
- [ ] Chốt spacing system cho card, list item, sheet và form.
- [ ] Chốt icon style và rule sử dụng.
- [ ] Chốt elevation, border radius, divider và shadow.
- [ ] Chốt safe area rule cho iOS và Android.

### 5. Core screens
- [ ] Welcome screen.
- [x] Login screen.
- [x] Register screen.
- [x] Home screen.
- [x] Quick Add Transaction sheet.
- [x] Transactions list screen.
- [x] Transaction detail hoặc edit screen.
- [x] Budget list screen.
- [x] Budget form screen hoặc sheet.
- [x] Reports screen.
- [x] Profile screen.
- [x] Settings hoặc Notification Preference screen.

### 6. Edge states và feedback
- [x] Loading state cho màn Home.
- [x] Empty state khi chưa có transaction.
- [x] Empty state khi chưa có budget.
- [x] Error state khi API lỗi.
- [ ] Offline state hoặc local draft state.
- [ ] Success feedback khi tạo transaction.
- [x] Confirm delete cho transaction và budget.
- [x] Warning state khi budget đạt 80% và 100%.

### 7. Content và microcopy
- [ ] Chốt tone giọng cho app: rõ ràng, đáng tin, không quá kỹ thuật.
- [ ] Viết CTA chính cho từng màn.
- [ ] Viết empty-state copy.
- [ ] Viết error-state copy.
- [ ] Viết notification copy cho budget warning.
- [ ] Viết monthly review summary copy mẫu.

### 8. Technical readiness
- [x] Chốt stack Expo + React Native + TypeScript.
- [x] Chốt navigation bằng Expo Router.
- [x] Chốt query/cache strategy.
- [x] Chốt secure token storage.
- [x] Chốt form validation strategy.
- [x] Chốt chart library phù hợp với Expo.
- [x] Chốt cách format tiền theo string amount từ backend.
- [x] Chốt timezone rule theo UTC ở API và local format trên app.

### 9. Dev handoff
- [ ] Có screen list hoàn chỉnh.
- [ ] Có component inventory.
- [x] Có design token hoặc guideline đủ rõ.
- [ ] Có API mapping theo từng flow.
- [ ] Có prompt UI/UX mobile app.
- [ ] Có prompt mobile developer.
- [ ] Có danh sách trạng thái loading, empty, error và offline.

### 10. QA trước khi vào build
- [ ] Prototype đã được review trên ít nhất 2 viewport.
- [ ] Quick Add flow có thể hoàn thành trong dưới 15 giây.
- [ ] Budget warning đủ dễ hiểu.
- [ ] Reports không bị quá dày trên màn nhỏ.
- [ ] Tab bar và sheet không xung đột thao tác.
- [ ] Scope MVP đã khóa để tránh trượt tiến độ.

## Screen inventory

### Nhóm A - Auth

#### A1. Welcome
- Mục tiêu: giới thiệu giá trị chính của app và dẫn vào login hoặc register.
- Thành phần chính: logo, headline, value proposition ngắn, CTA login, CTA register.
- Hành động chính: đi tới Login hoặc Register.
- Trạng thái cần có: loading khởi động, offline nếu app không tải được asset từ xa.

#### A2. Login
- Mục tiêu: cho người dùng đăng nhập nhanh và an toàn.
- Thành phần chính: email, password, submit button, link sang register.
- Hành động chính: login, retry khi lỗi.
- API liên quan: `POST /auth/login`, `GET /auth/me`.
- Trạng thái cần có: submitting, invalid credentials, network error.

#### A3. Register
- Mục tiêu: tạo tài khoản mới với form ngắn gọn.
- Thành phần chính: full name, email, password, confirm password nếu cần.
- Hành động chính: register và tự đăng nhập sau khi thành công.
- API liên quan: `POST /auth/register`, `GET /auth/me`.
- Trạng thái cần có: validation error, submit loading, register success.

### Nhóm B - Main tabs

#### B1. Home
- Mục tiêu: cho người dùng thấy toàn cảnh tài chính ngay khi mở app.
- Thành phần chính: balance hero, income card, expense card, budget warning banner, quick actions, recent transactions.
- Hành động chính: mở quick add, vào reports, vào budgets, mở transaction detail.
- API liên quan: bundle dashboard hiện có hoặc các endpoint reports và transaction summary tương đương.
- Trạng thái cần có: loading skeleton, empty recent transactions, API error, stale data.

#### B2. Transactions
- Mục tiêu: duyệt, lọc và chỉnh sửa giao dịch.
- Thành phần chính: search, segmented control income/expense, filter chips, list item, swipe action edit/delete.
- Hành động chính: tạo mới, lọc, mở detail, edit, delete.
- API liên quan: `GET /transactions`, `POST /transactions`, `PATCH /transactions/:id`, `DELETE /transactions/:id`.
- Trạng thái cần có: empty list, no filter result, deleting, refresh, pagination hoặc infinite scroll.

#### B3. Budgets
- Mục tiêu: theo dõi tình trạng ngân sách theo category.
- Thành phần chính: budget card, progress bar, status badge, CTA tạo mới.
- Hành động chính: tạo budget, sửa budget, xóa budget, mở detail category.
- API liên quan: `GET /budgets`, `POST /budgets`, `PATCH /budgets/:id`, `DELETE /budgets/:id`.
- Trạng thái cần có: empty budget, warning state, exceeded state, refresh error.

#### B4. Reports
- Mục tiêu: đọc nhanh xu hướng tài chính trên mobile.
- Thành phần chính: kỳ hiện tại, pie chart category, bar chart monthly trend, insight text ngắn.
- Hành động chính: đổi kỳ, xem detail chart, quay về Home hoặc Budgets.
- API liên quan: `GET /reports/by-category`, `GET /reports/monthly-trend`, `GET /reports/summary`.
- Trạng thái cần có: loading chart, no data, chart error, stale state.

#### B5. Profile
- Mục tiêu: quản lý tài khoản và thiết lập cá nhân.
- Thành phần chính: user info, avatar editor, đổi mật khẩu, entry quên mật khẩu, sync action, logout, app version.
- Hành động chính: refresh profile, cập nhật hồ sơ, đổi mật khẩu, mở flow quên mật khẩu, logout.
- API liên quan: `GET /auth/me`, `PATCH /auth/profile`, `POST /auth/change-password`, `POST /auth/forgot-password`, `POST /auth/reset-password`.
- Trạng thái cần có: loading account info, token expired, logout confirm.

### Nhóm C - Sheets, modal và detail

#### C1. Quick Add Transaction Sheet
- Mục tiêu: thêm giao dịch nhanh từ mọi nơi trong app.
- Thành phần chính: toggle income/expense, amount input, category picker, date picker, note input, submit button.
- Hành động chính: tạo transaction và đóng sheet với success feedback.
- API liên quan: `POST /transactions`, `GET /categories`.
- Trạng thái cần có: validation error, submitting, submit success, offline draft.

#### C2. Transaction Detail hoặc Edit
- Mục tiêu: xem lại chi tiết và chỉnh sửa giao dịch đã tạo.
- Thành phần chính: amount, category, date, note, action edit/delete.
- Hành động chính: save update, confirm delete.
- API liên quan: `GET /transactions/:id`, `PATCH /transactions/:id`, `DELETE /transactions/:id`.
- Trạng thái cần có: loading detail, update success, delete confirm, permission error.

#### C3. Transaction Filter Sheet
- Mục tiêu: lọc transaction theo kỳ, loại và category.
- Thành phần chính: month, year, type, category, reset, apply.
- Hành động chính: apply filter, reset filter.
- API liên quan: `GET /transactions` với query filters.
- Trạng thái cần có: apply loading nếu cần, no result state sau khi áp filter.

#### C4. Budget Create hoặc Edit Sheet
- Mục tiêu: tạo hoặc sửa budget theo category expense.
- Thành phần chính: category picker, limit amount, period label, save action.
- Hành động chính: save, cancel, delete nếu ở mode edit.
- API liên quan: `POST /budgets`, `PATCH /budgets/:id`, `DELETE /budgets/:id`, `GET /categories`.
- Trạng thái cần có: duplicate budget error, invalid category, submit success.

#### C5. Budget Detail
- Mục tiêu: xem chi tiết 1 budget và phần chi tiêu liên quan.
- Thành phần chính: category name, limit, spent, remaining, status, action buttons.
- Hành động chính: edit, delete, mở transactions của category.
- API liên quan: budget data hiện có và transaction list filtered.
- Trạng thái cần có: exceeded, warning, healthy, no related transactions.

### Nhóm D - System states và bổ sung

#### D1. Notification Preference
- Mục tiêu: bật hoặc tắt budget warning và reminder.
- Thành phần chính: toggle budget 80%, toggle budget 100%, toggle daily reminder.
- Hành động chính: save preference.
- Trạng thái cần có: OS permission denied, save success, save failed.

#### D2. Monthly Review
- Mục tiêu: tóm tắt nhanh tháng trước bằng insight đơn giản.
- Thành phần chính: balance delta, top expense category, CTA xem reports.
- Hành động chính: đóng review hoặc mở report detail.
- Trạng thái cần có: no prior data, first month state.

#### D3. Global Empty/Error/Offline Templates
- Mục tiêu: tái sử dụng template phản hồi trên toàn app.
- Thành phần chính: icon, title, description, retry action, secondary action.
- Hành động chính: retry, go back, quick add nếu phù hợp.
- Trạng thái cần có: network error, unauthorized, no data, local draft pending.
