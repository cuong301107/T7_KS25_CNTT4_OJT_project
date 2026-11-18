# ShopEase — Website Thương mại điện tử

Dự án cá nhân: website thương mại điện tử với giao diện tối giản (tông màu **trắng & xám**), hỗ trợ khách hàng mua sắm trực tuyến và trang quản trị cho Admin.

- **Frontend:** HTML5, CSS3, JavaScript thuần (không framework)
- **Backend:** Node.js + Express.js (REST API)
- **Database:** MySQL (8 bảng, chuẩn hóa 3NF)

---

## 1. Cấu trúc dự án

```
ShopEase/
├── backend/
│   ├── database/
│   │   └── schema.sql          # DDL khởi tạo database + 8 bảng
│   ├── src/
│   │   ├── config/             # env, kết nối MySQL
│   │   ├── controllers/        # auth, product, category, cart, order, review, admin
│   │   ├── middlewares/        # xác thực JWT, phân quyền, xử lý lỗi
│   │   ├── routes/             # khai báo các route REST
│   │   ├── utils/              # ApiError, asyncHandler, sinh mã đơn
│   │   ├── server.js           # điểm vào ứng dụng
│   │   └── seed.js             # tạo database + dữ liệu mẫu
│   ├── .env.example            # cấu hình mẫu
│   └── package.json
└── frontend/
    ├── index.html              # Trang chủ
    ├── products.html           # Danh sách / tìm kiếm / lọc sản phẩm
    ├── product.html            # Chi tiết sản phẩm + đánh giá
    ├── login.html / register.html
    ├── cart.html               # Giỏ hàng
    ├── checkout.html           # Thanh toán (COD)
    ├── orders.html             # Lịch sử đơn hàng
    ├── profile.html            # Thông tin cá nhân
    ├── admin/                  # Trang quản trị
    │   ├── login.html
    │   ├── dashboard.html
    │   ├── products.html
    │   ├── categories.html
    │   ├── orders.html
    │   └── users.html
    └── assets/
        ├── css/main.css        # Toàn bộ giao diện (trắng & xám)
        └── js/                 # api.js, common.js, admin.js
```

---

## 2. Yêu cầu cài đặt

- **Node.js** ≥ 18
- **MySQL** ≥ 5.7 (khuyến nghị XAMPP / Laragon / MySQL Workbench)

---

## 3. Hướng dẫn chạy

### Bước 1 — Cấu hình kết nối MySQL

```bash
cd backend
copy .env.example .env      # trên Windows
# (Linux/Mac: cp .env.example .env)
```

Mở `.env` và chỉnh lại thông tin kết nối MySQL nếu cần :

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=rootdeptrai
DB_PASSWORD=123456
DB_NAME=shopease_db

### Bước 2 — Cài đặt thư viện

```bash
cd backend
npm install        # hoặc: pnpm install
```

### Bước 3 — Tạo database & dữ liệu mẫu

```bash
npm run seed
```

Lệnh này sẽ tạo database `shopease_db`, 8 bảng và dữ liệu mẫu (tài khoản, danh mục, sản phẩm, đơn hàng, đánh giá).

### Bước 4 — Chạy ứng dụng

```bash
npm start          # hoặc: npm run dev
```

Mở trình duyệt: **http://localhost:5000**

> Backend vừa cung cấp REST API tại `/api/*`, vừa phục vụ giao diện frontend tĩnh từ thư mục `frontend`.

---

## 4. Tài khoản demo

| Vai trò | Email | Mật khẩu |
| ------- | ----- | -------- |

á

Trang quản trị: **http://localhost:5000/admin/login.html**

---

## 5. Danh sách API chính

### Xác thực

| Method | Endpoint             | Mô tả                         |
| ------ | -------------------- | ----------------------------- |
| POST   | `/api/auth/register` | Đăng ký tài khoản             |
| POST   | `/api/auth/login`    | Đăng nhập (trả về JWT)        |
| GET    | `/api/auth/me`       | Thông tin người dùng hiện tại |
| PUT    | `/api/auth/me`       | Cập nhật thông tin cá nhân    |

### Sản phẩm / danh mục (công khai)

| Method | Endpoint                    | Mô tả                                          |
| ------ | --------------------------- | ---------------------------------------------- |
| GET    | `/api/products`             | Danh sách (phân trang, tìm kiếm, lọc, sắp xếp) |
| GET    | `/api/products/:id`         | Chi tiết sản phẩm                              |
| GET    | `/api/categories`           | Danh sách danh mục                             |
| GET    | `/api/products/:id/reviews` | Đánh giá của sản phẩm                          |
| POST   | `/api/products/:id/reviews` | Gửi/cập nhật đánh giá (cần đăng nhập)          |

### Giỏ hàng & đơn hàng (cần đăng nhập)

| Method | Endpoint                 | Mô tả                      |
| ------ | ------------------------ | -------------------------- |
| GET    | `/api/cart`              | Xem giỏ hàng               |
| POST   | `/api/cart`              | Thêm sản phẩm              |
| PUT    | `/api/cart/:itemId`      | Cập nhật số lượng          |
| DELETE | `/api/cart/:itemId`      | Xóa sản phẩm               |
| GET    | `/api/orders`            | Lịch sử đơn hàng           |
| POST   | `/api/orders`            | Tạo đơn hàng (transaction) |
| GET    | `/api/orders/:id`        | Chi tiết đơn hàng          |
| POST   | `/api/orders/:id/cancel` | Hủy đơn (chỉ khi PENDING)  |

### Quản trị (cần quyền Admin)

| Method     | Endpoint                       | Mô tả                        |
| ---------- | ------------------------------ | ---------------------------- |
| GET        | `/api/admin/stats`             | Thống kê tổng quan           |
| GET/POST   | `/api/admin/products`          | Danh sách / thêm sản phẩm    |
| PUT/DELETE | `/api/admin/products/:id`      | Sửa / xóa sản phẩm           |
| GET/POST   | `/api/admin/categories`        | Danh sách / thêm danh mục    |
| PUT/DELETE | `/api/admin/categories/:id`    | Sửa / xóa danh mục           |
| GET        | `/api/admin/orders`            | Danh sách đơn hàng           |
| PUT        | `/api/admin/orders/:id/status` | Cập nhật trạng thái đơn hàng |
| GET        | `/api/admin/users`             | Danh sách người dùng         |
| PATCH      | `/api/admin/users/:id/status`  | Khóa / mở khóa tài khoản     |

---

## 6. Quy tắc nghiệp vụ nổi bật

- Mật khẩu được băm bằng **bcrypt**; API yêu cầu đăng nhập xác thực bằng **JWT**; API quản trị kiểm tra quyền **ADMIN**.
- Trạng thái đơn hàng chuyển theo luồng hợp lệ:
  `PENDING → CONFIRMED → SHIPPING → COMPLETED`, và `PENDING → CANCELLED`.
- Tạo đơn hàng & trừ tồn kho chạy trong **transaction**; hủy đơn sẽ **hoàn lại tồn kho**.
- Giá tại thời điểm đặt được lưu riêng ở `order_items.unit_price` (snapshot).
- Doanh thu chỉ tính từ các đơn **COMPLETED**.
- Không thể khóa Admin cuối cùng, không thể tự khóa chính mình.
