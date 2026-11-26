# BÁO CÁO KIỂM THỬ API VÀ CÁC LUỒNG NGHIỆP VỤ (TEST/API-BUSINESS-FLOWS)
**Dự án:** ShopEase - Website Thương mại điện tử  
**Môn học / Học phần:** On Job Training (OJT) - KS25 CNTT4  
**Công cụ kiểm thử:** Postman, Node.js Test Scripts, cURL  

---

## 1. Mục tiêu kiểm thử
- Kiểm thử toàn diện các API RESTful của hệ thống Backend ShopEase.
- Xác thực các luồng nghiệp vụ cốt lõi:
  1. Đăng ký, đăng nhập (bcrypt + JWT), xác thực & phân quyền (Customer vs Admin).
  2. Xem danh sách danh mục, sản phẩm, tìm kiếm, lọc theo giá, xem chi tiết sản phẩm.
  3. Quản lý giỏ hàng: thêm sản phẩm, cập nhật số lượng, xóa sản phẩm, tính toán giá trị giỏ hàng.
  4. Quy trình đặt hàng COD: kiểm tra tồn kho, tạo đơn hàng trong transaction, xem lịch sử đơn hàng, hủy đơn hàng trạng thái PENDING.
  5. Quản trị viên: thống kê doanh thu, quản lý danh mục/sản phẩm (CRUD), quản lý đơn hàng & cập nhật trạng thái, quản lý người dùng (khóa/mở khóa).
  6. Kiểm tra an toàn bảo mật: mã hóa mật khẩu bcrypt, kiểm tra JWT hợp lệ, chặn truy cập tài nguyên trái phép (401 Unauthorized, 403 Forbidden).

---

## 2. Dữ liệu kiểm thử mẫu (Test Data Seed)
Hệ thống sử dụng file seed ackend/src/seed.js để chuẩn bị môi trường kiểm thử:
- **Tài khoản Admin:** dmin@shopease.com / Admin@123
- **Tài khoản Customer:** customer@shopease.com / Customer@123
- **Danh mục mẫu:** Điện thoại, Laptop, Máy tính bảng, Phụ kiện, Đồ gia dụng.
- **Sản phẩm mẫu:** 12 sản phẩm với giá bán, tồn kho, hình ảnh và mô tả chi tiết.
- **Đơn hàng mẫu:** 2 đơn hàng với các trạng thái COMPLETED và PENDING.

---

## 3. Ma trận Test Cases và Kết quả thực hiện

| Mã TC | Phân hệ / Nghiệp vụ | Mô tả Test Case | Phương thức & URL | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|---|
| TC-01 | Auth | Đăng ký tài khoản khách hàng mới | POST /api/auth/register | Trả về 201, tạo user thành công | 201 Created | PASSED |
| TC-02 | Auth | Đăng nhập tài khoản khách hàng | POST /api/auth/login | Trả về 200, JWT token hợp lệ | 200 OK + JWT | PASSED |
| TC-03 | Auth | Đăng nhập với mật khẩu sai | POST /api/auth/login | Trả về 401 hoặc 400 | 401 Unauthorized | PASSED |
| TC-04 | Auth | Lấy thông tin cá nhân qua JWT | GET /api/auth/me | Trả về thông tin user đã đăng nhập | 200 OK | PASSED |
| TC-05 | Products | Lấy danh mục sản phẩm công khai | GET /api/products/categories | Trả về danh sách categories | 200 OK | PASSED |
| TC-06 | Products | Tìm kiếm và lọc sản phẩm theo giá | GET /api/products?keyword=iPhone | Trả về sản phẩm khớp từ khóa | 200 OK | PASSED |
| TC-07 | Products | Xem chi tiết sản phẩm hợp lệ | GET /api/products/:id | Trả về thông tin chi tiết sản phẩm | 200 OK | PASSED |
| TC-08 | Products | Xem chi tiết sản phẩm không tồn tại | GET /api/products/99999 | Trả về 404 Not Found | 404 Not Found | PASSED |
| TC-09 | Cart | Lấy danh sách sản phẩm trong giỏ hàng | GET /api/cart | Trả về danh sách items trong giỏ | 200 OK | PASSED |
| TC-10 | Cart | Thêm sản phẩm vào giỏ hàng | POST /api/cart/items | Thêm mới item hoặc tăng quantity | 200 OK | PASSED |
| TC-11 | Cart | Cập nhật số lượng item trong giỏ | PUT /api/cart/items/:id | Cập nhật số lượng và thành tiền | 200 OK | PASSED |
| TC-12 | Cart | Xóa sản phẩm khỏi giỏ hàng | DELETE /api/cart/items/:id | Xóa item khỏi giỏ | 200 OK | PASSED |
| TC-13 | Order | Đặt hàng thanh toán COD | POST /api/orders | Tạo order, trừ tồn kho, xóa giỏ | 201 Created | PASSED |
| TC-14 | Order | Xem lịch sử đơn hàng của tôi | GET /api/orders | Trả về danh sách đơn đã đặt | 200 OK | PASSED |
| TC-15 | Order | Hủy đơn hàng trạng thái PENDING | PUT /api/orders/:id/cancel | Hoàn tồn kho, cập nhật CANCELLED | 200 OK | PASSED |
| TC-16 | Admin | Thống kê số liệu Dashboard | GET /api/admin/stats | Trả về tổng doanh thu, đơn hàng, user | 200 OK | PASSED |
| TC-17 | Admin | Quản lý danh mục (Thêm mới) | POST /api/admin/categories | Tạo danh mục thành công | 201 Created | PASSED |
| TC-18 | Admin | Quản lý sản phẩm (Thêm mới) | POST /api/admin/products | Thêm sản phẩm thành công | 201 Created | PASSED |
| TC-19 | Admin | Cập nhật trạng thái đơn hàng | PUT /api/admin/orders/:id/status | Trạng thái chuyển PROCESSING/SHIPPED | 200 OK | PASSED |
| TC-20 | Security | Truy cập API yêu cầu đăng nhập không có JWT | GET /api/cart | Chặn truy cập, trả về 401 | 401 Unauthorized | PASSED |
| TC-21 | Security | Customer truy cập API của Admin | GET /api/admin/stats | Chặn truy cập, trả về 403 Forbidden | 403 Forbidden | PASSED |

---

## 4. Hướng dẫn import và chạy kiểm thử với Postman
1. Khởi động backend: cd backend && npm start
2. Mở ứng dụng Postman.
3. Chọn **Import** -> chọn file 	est/ShopEase_API_Testing.postman_collection.json.
4. Trong Postman, chạy tuần tự từng Request hoặc dùng **Postman Collection Runner** để chạy tự động toàn bộ 21 test cases.
