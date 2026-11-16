# FinanceLab – Nền tảng giáo dục tài chính cá nhân dựa trên ngân sách

FinanceLab là website giúp người dùng học cách quản lý tiền thông qua việc lập ngân sách và theo dõi thu – chi hằng ngày. Ngoài ghi chép giao dịch, hệ thống còn hỗ trợ đặt mục tiêu tiết kiệm, thử các kịch bản tài chính, học kiến thức cơ bản và nhận phản hồi để điều chỉnh kế hoạch.

Đây là sản phẩm phục vụ học tập và quản lý tài chính cá nhân; **không kết nối ngân hàng, không thực hiện giao dịch tiền thật và không tư vấn đầu tư**.

## Công nghệ sử dụng

- **Frontend:** React 19, Vite, Nginx.
- **Backend:** Java 17, Spring Boot 3.4.4, Spring Security, JDBC.
- **Cơ sở dữ liệu:** Microsoft SQL Server 2022.
- **Đăng nhập:** Google (OpenID Connect).
- **Triển khai:** Docker Compose.

## Chức năng chính

- Đăng nhập bằng tài khoản Google, quản lý hồ sơ cá nhân.
- Ghi nhận thu nhập, chi tiêu và quản lý danh mục.
- Lập ngân sách, theo dõi hạn mức và xem gợi ý điều chỉnh.
- Tạo mục tiêu tài chính, ghi nhận đóng góp và mô phỏng tiết kiệm.
- Học kiến thức tài chính, làm câu hỏi và thực hành tình huống.
- Xem báo cáo, cảnh báo, giao dịch định kỳ và dữ liệu mẫu.

## Cài đặt và chạy chương trình

### 1. Chuẩn bị

Cài **Docker Desktop** và bật Docker Engine. Cần có tài khoản Google và thông tin **OAuth Client ID / Client Secret** đã tạo trên Google Cloud Console.

### 2. Tạo file `.env`

Tại thư mục gốc của project (cùng cấp với `compose.yaml`), tạo file `.env` và điền thông tin của bạn:

```dotenv
MSSQL_SA_PASSWORD=ThayBangMatKhauSQLManhCuaBan
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:5173
OAUTH_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
```

Trong phần cấu hình OAuth của Google Cloud, thêm **Authorized redirect URI**:

```text
http://localhost:8080/login/oauth2/code/google
```

> Không đưa `.env`, mật khẩu hoặc Google Client Secret lên GitHub hay vào file ZIP chia sẻ. Mỗi người chạy project cần tự cung cấp cấu hình phù hợp.

### 3. Khởi chạy

Mở PowerShell hoặc terminal tại thư mục gốc của project và chạy:

```powershell
docker compose up -d --build
```

Lần đầu, Docker sẽ tải image, build ứng dụng và khởi tạo cơ sở dữ liệu từ `database/PersonalFinanceEducation.sql`.

Kiểm tra các dịch vụ:

```powershell
docker compose ps -a
```

Sau đó mở **http://localhost:5173** và chọn đăng nhập bằng Google.

Các địa chỉ cần biết:

| Thành phần | Địa chỉ |
|---|---|
| Website | http://localhost:5173 |
| Backend | http://localhost:8080 |
| SQL Server (từ máy tính) | `127.0.0.1,14333` |

Đăng nhập SQL Server bằng tài khoản `sa` và mật khẩu bạn đã đặt trong `.env`.

### 4. Dừng và chạy lại

Dừng hệ thống (giữ nguyên dữ liệu):

```powershell
docker compose down
```

Chạy lại:

```powershell
docker compose up -d
```

Xem log khi cần kiểm tra lỗi:

```powershell
docker compose logs --tail=100 backend frontend sql-init
```

**Lưu ý:** Không dùng `docker compose down -v` nếu muốn giữ dữ liệu SQL Server. Khi đã có database, nên sao lưu trước khi cập nhật project.

## Cấu trúc thư mục

```text
PersonalFinanceEducation/
├── frontend/             # Giao diện React
├── backend/              # API và xử lý nghiệp vụ Spring Boot
├── database/             # SQL chính và script khởi tạo
├── compose.yaml          # Cấu hình các dịch vụ Docker
├── .env                  # Cấu hình riêng trên máy (không chia sẻ)
└── README.md
```

## Ghi chú

Hệ thống sử dụng tài khoản Google thật để đăng nhập. Dữ liệu tài chính của từng người dùng được quản lý riêng; dữ liệu mẫu phục vụ việc trải nghiệm và học tập, không phải giao dịch ngân hàng thực tế.

Nếu không đăng nhập được, hãy kiểm tra `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` và redirect URI trong Google Cloud. Nếu các container không khởi động, xem log bằng lệnh ở trên trước khi chạy lại.
