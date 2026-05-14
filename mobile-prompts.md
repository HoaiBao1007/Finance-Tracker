# Finance Tracker - Mobile Prompt Pack

## Prompt - Mobile UI/UX

Tôi muốn bạn đóng vai Senior Product Designer và Mobile UX Designer để thiết kế app mobile cho dự án Finance Tracker.

### Bối cảnh dự án
- Dự án hiện đã có backend REST API ổn định cho auth, category, transaction, budget và reports.
- Web app hiện đã có dashboard usable với budget warning, summary cards, reports chart, transaction CRUD và auth flow.
- Mục tiêu của mobile app không phải là thu nhỏ dashboard web, mà là thiết kế lại cho tình huống dùng nhanh trên điện thoại.

### Mục tiêu sản phẩm
- Giúp người dùng kiểm tra tình trạng tài chính cá nhân chỉ trong vài giây.
- Giúp người dùng thêm transaction cực nhanh ngay sau khi phát sinh chi tiêu.
- Giúp người dùng nhận ra budget nào đang rủi ro mà không cần đọc nhiều dữ liệu.
- Tạo trải nghiệm đáng tin cậy, hiện đại, gọn và rõ ràng trên iOS lẫn Android.

### Đối tượng người dùng
- Người đi làm theo dõi chi tiêu cá nhân hàng ngày.
- Người muốn kiểm soát ngân sách theo category.
- Người cần nhìn nhanh balance, income, expense và alert thay vì đọc bảng lớn như trên desktop.

### Phạm vi Mobile MVP
- Auth: login, register, me, logout.
- Home: balance, total income, total expense, budget health, recent transactions, quick actions.
- Transactions: list, filter, create, edit, delete.
- Budgets: list, create, edit, delete, warning state.
- Reports: expense by category, monthly trend, summary insight.
- Profile: account, sync, notification setting, logout.

### Yêu cầu trải nghiệm
- Mobile-first, một tay, ít bước, thao tác chính trong vùng ngón tay cái.
- Ưu tiên bottom tab bar, bottom sheet, sticky summary header và inline feedback.
- Quick Add Transaction phải là flow nhanh nhất trong toàn app.
- Không dùng bảng dày đặc hoặc layout nhiều cột như desktop.
- Budget warning phải nổi bật nhưng không gây hoảng loạn.
- Charts phải dễ đọc trên màn hình nhỏ và chỉ giữ mức tóm tắt cần thiết.

### Kiến trúc thông tin đề xuất
- 5 tab chính: Home, Transactions, Budgets, Reports, Profile.
- Luồng phụ: Quick Add Transaction Sheet, Transaction Filter Sheet, Budget Form Sheet, Monthly Review, Notification Preference.

### Phong cách thị giác mong muốn
- Tone đáng tin, sạch, hiện đại, không flashy.
- Giữ liên hệ với web hiện tại:
  - nền sáng sạch theo hướng slate.
  - action primary dùng blue.
  - income dùng green.
  - expense dùng red.
  - budget warning dùng amber hoặc orange.
- Typography rõ ràng, nhấn mạnh số tiền và phân cấp headline tốt.
- Bo góc mềm, card rõ ràng, shadow tiết chế.
- Motion vừa đủ cho sheet, success feedback và tab transition.

### Màn hình bắt buộc phải thiết kế
- Welcome.
- Login.
- Register.
- Home.
- Quick Add Transaction Sheet.
- Transactions List.
- Transaction Detail hoặc Edit.
- Transaction Filter Sheet.
- Budgets List.
- Budget Create hoặc Edit Sheet.
- Budget Detail.
- Reports.
- Profile.
- Notification Preference.
- Global Empty, Error và Offline state.

### Trạng thái bắt buộc phải thể hiện
- Loading.
- Empty state khi chưa có transaction.
- Empty state khi chưa có budget.
- Error state khi API lỗi.
- Success state sau khi tạo transaction hoặc budget.
- Budget warning khi đạt 80%.
- Budget exceeded khi vượt 100%.
- Session expired hoặc unauthorized.

### Yêu cầu output từ bạn
- Đề xuất sitemap mobile.
- Đề xuất user flow cho auth, home, quick add, transactions, budgets, reports.
- Mô tả wireframe hoặc layout cho từng màn chính.
- Đề xuất design system gồm color token, typography scale, spacing rule và component patterns.
- Mô tả rõ thành phần chính của từng màn hình.
- Đề xuất hierarchy nội dung cho Home để người dùng nhìn thấy balance và warning trước.
- Đề xuất UX pattern cho quick add, filter và delete confirm.
- Đề xuất copy ngắn cho CTA, empty state và error state.
- Đề xuất animation hoặc transition cần có và giải thích vì sao chúng hữu ích.
- Chỉ rõ phần nào nên làm ở MVP và phần nào nên để sau MVP.

### Ràng buộc kỹ thuật để bạn thiết kế thực tế hơn
- App dự kiến build bằng Expo React Native.
- Backend hiện trả amount và limitAmount dưới dạng string để tránh lỗi với BigInt.
- Dữ liệu thời gian lấy theo UTC từ backend, chỉ format local ở client.
- Reports hiện có 2 chart chính: expense by category và monthly trend.
- App cần khả năng dùng tốt trên viewport iPhone tiêu chuẩn và Android phổ biến.

### Cách trả lời mong muốn
- Bắt đầu bằng concept sản phẩm mobile trong 1 đoạn ngắn.
- Sau đó chia theo các phần: Information Architecture, Screen Strategy, Design System, UX Patterns, States, MVP vs Post-MVP.
- Với mỗi màn hình, nêu rõ: mục tiêu, nội dung ưu tiên, CTA chính, CTA phụ và lưu ý mobile-specific.
- Ưu tiên câu trả lời có thể dùng ngay để dựng Figma hoặc handoff cho developer.

---

## Prompt - Mobile Developer

Tôi muốn bạn đóng vai Senior React Native Engineer để xây dựng app mobile cho dự án Finance Tracker bằng Expo.

### Bối cảnh dự án
- Dự án đã có backend REST API và web app MVP đang chạy.
- Backend hiện có auth, category, transaction, budget và reports.
- Web app đã chứng minh API contract và business rule hoạt động.
- Mục tiêu của app mobile là tái sử dụng tối đa backend hiện tại, không thiết kế lại dữ liệu.

### Mục tiêu kỹ thuật
- Xây mobile app MVP usable, dễ mở rộng và nhất quán với hệ thống hiện tại.
- Ưu tiên code rõ ràng, module theo feature, có thể tiếp tục mở rộng sau MVP.
- Tập trung vào auth, home summary, transactions, budgets, reports và profile.

### Stack khuyến nghị
- Expo.
- React Native.
- TypeScript strict.
- Expo Router cho navigation.
- TanStack Query cho data fetching, caching và invalidation.
- React Hook Form + Zod cho form.
- expo-secure-store để lưu access token.
- react-native-reanimated + react-native-gesture-handler cho sheet, swipe action và motion cơ bản.
- NativeWind nếu muốn giữ tư duy utility styling gần với web hiện tại.
- Victory Native hoặc thư viện chart tương đương ổn định với Expo để dựng pie chart và bar chart.

### Yêu cầu nghiệp vụ phải giữ nguyên
- Auth token được lưu an toàn và khôi phục phiên khi mở app lại.
- Mỗi request protected phải đính kèm bearer token.
- amount và limitAmount từ API là string, không ép sang float cho logic tài chính.
- Mọi logic tiền tệ phải giữ độ chính xác, chỉ format khi hiển thị.
- Dữ liệu ngày giờ lấy từ API theo UTC, chỉ format local khi render.
- Budget chỉ áp dụng cho expense category.

### Phạm vi Mobile MVP cần build

#### Auth
- Welcome.
- Login.
- Register.
- Me và restore session.
- Logout.

#### Home
- Balance summary.
- Total income và total expense.
- Budget health banner.
- Recent transactions.
- Quick actions.

#### Transactions
- List transactions.
- Filter theo month, year, type và category.
- Create transaction.
- Edit transaction.
- Delete transaction.

#### Budgets
- List budgets.
- Create budget.
- Edit budget.
- Delete budget.
- Warning và exceeded state.

#### Reports
- Expense by category chart.
- Monthly trend chart.
- Đổi kỳ xem dữ liệu.

#### Profile
- Current user info.
- Refresh hoặc sync action.
- Notification settings placeholder nếu chưa có backend lưu preferences.
- Logout.

### API cần tận dụng
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /categories`
- `GET /transactions`
- `POST /transactions`
- `GET /transactions/:id`
- `PATCH /transactions/:id`
- `DELETE /transactions/:id`
- `GET /budgets`
- `POST /budgets`
- `PATCH /budgets/:id`
- `DELETE /budgets/:id`
- `GET /reports/summary`
- `GET /reports/by-category`
- `GET /reports/monthly-trend`
- Nếu backend đã có bundle endpoint cho dashboard, ưu tiên tái sử dụng để giảm burst request ở Home.

### Kiến trúc thư mục mong muốn
app/
- `(auth)/welcome.tsx`
- `(auth)/login.tsx`
- `(auth)/register.tsx`
- `(tabs)/home.tsx`
- `(tabs)/transactions.tsx`
- `(tabs)/budgets.tsx`
- `(tabs)/reports.tsx`
- `(tabs)/profile.tsx`
- `transaction/[id].tsx`
- `budget/[id].tsx`

src/
- `components/`
- `features/auth/`
- `features/home/`
- `features/transactions/`
- `features/budgets/`
- `features/reports/`
- `features/profile/`
- `lib/api/`
- `lib/storage/`
- `lib/format/`
- `hooks/`
- `store/`
- `types/`
- `schemas/`

### Yêu cầu implementation
- Tạo API client dùng fetch hoặc axios với interceptor cho auth token.
- Tạo query keys rõ ràng cho auth, dashboard, transactions, budgets và reports.
- Invalidate query đúng sau create, update và delete.
- Tách form schema và form component cho transaction và budget.
- Có reusable screen state cho loading, empty và error.
- Có reusable confirm action cho delete.
- Có bottom sheet hoặc modal pattern nhất quán.
- Có snackbar hoặc toast nhẹ cho success và error feedback.
- Có pull-to-refresh ở Home, Transactions và Budgets.
- Nếu hợp lý, hỗ trợ local draft cho Quick Add khi người dùng bị mất mạng.

### Giao diện và UX cần bám theo
- 5 tab chính: Home, Transactions, Budgets, Reports, Profile.
- Quick Add Transaction phải mở nhanh, ít trường, điền trong dưới 15 giây.
- Home phải ưu tiên balance, income, expense và budget warning ở nửa trên màn hình.
- Transactions dùng list dễ cuộn, không dùng table desktop-style.
- Budgets ưu tiên progress bar, warning badge và CTA edit rõ ràng.
- Reports chỉ nên có chart và summary ngắn, tránh nhồi quá nhiều số.

### Yêu cầu chất lượng code
- Không over-engineer.
- Giữ component nhỏ, theo feature rõ ràng.
- Ưu tiên root-cause fix nếu phát sinh bug.
- Tránh duplicate logic format tiền, format ngày và parse error.
- Viết mã dễ test và dễ maintain.
- Nếu thiếu API cho một UX cụ thể, nêu rõ và đề xuất fallback hợp lý thay vì tự bẻ contract.

### Output mong muốn từ bạn
- Cấu trúc dự án Expo hoàn chỉnh.
- Setup navigation, auth guard và restore session.
- Mã nguồn cho các màn chính của MVP.
- API client, hooks query và mutation chính.
- Shared component cho cards, list item, sheet, alert, skeleton và empty state.
- `.env.example` hoặc config mẫu cho base URL API.
- Hướng dẫn chạy app bằng npm scripts.
- Giải thích ngắn các quyết định quan trọng như token storage, data caching, chart choice và money handling.

### Cách làm mong muốn
- Triển khai theo từng lát mỏng: auth trước, rồi home, transactions, budgets, reports và profile.
- Sau mỗi lát mỏng, đảm bảo app build được và flow chính chạy được.
- Nếu có thể, dùng lại type hoặc schema từ codebase hiện tại để giảm lệch contract.
