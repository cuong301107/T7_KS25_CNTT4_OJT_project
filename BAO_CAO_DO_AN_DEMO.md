# BÁO CÁO ĐỒ ÁN VÀ KỊCH BẢN DEMO SHOPEASE
**Dự án:** ShopEase - Website Thương mại điện tử
**Môn học / Đợt:** On Job Training (OJT) - Lớp KS25 CNTT4
**Sinh viên thực hiện:** Lưu Cường
**Kho lưu trữ mã nguồn:** https://github.com/cuong301107/T7_KS25_CNTT4_OJT_project

---

## 1. Giới thiệu tổng quan đề tài
ShopEase là dự án website thương mại điện tử phục vụ nhu cầu mua sắm trực tuyến với thiết kế tối giản, hiện đại (tông màu trắng & xám). Hệ thống cung cấp đầy đủ các chức năng cho khách hàng mua sắm (Customer) và phân hệ quản trị toàn diện cho quản trị viên (Admin).

### Công nghệ sử dụng:
- **Frontend:** HTML5, CSS3, JavaScript thuần (Vanilla JS, Fetch API).
- **Backend:** Node.js, Express.js (Kiến trúc RESTful API chuẩn).
- **Cơ sở dữ liệu:** MySQL (Thiết kế chuẩn hóa 3NF gồm 8 bảng quan hệ).
- **Bảo mật & Phân quyền:** Mã hóa mật khẩu bcrypt, xác thực phiên JWT, phân quyền Role (ADMIN / CUSTOMER).

---

## 2. Danh mục tài liệu đặc tả & thiết kế
Tài liệu nằm trong thư mục 'tài liệu đặc tả/':
1. **SRS.docx:** Tài liệu đặc tả yêu cầu phần mềm chi tiết (Software Requirements Specification).
2. **Thiet_Ke_CSDL.docx:** Bản thiết kế chi tiết cơ sở dữ liệu, khóa chính, khóa ngoại và ràng buộc toàn vẹn.
3. **ERD.png:** Sơ đồ thực thể quan hệ (Entity Relationship Diagram) mô tả 8 bảng:
   - users (Admin & Customer)
   - categories (Danh mục sản phẩm)
   - products (Sản phẩm, giá bán, tồn kho)
   - carts & cart_items (Giỏ hàng khách hàng)
   - orders & order_items (Đơn hàng và chi tiết đơn)
   - reviews (Đánh giá sản phẩm)

---

## 3. Phân chia cấu trúc phân hệ (Branches) theo Task
1. **feature/auth-login:** API và giao diện xác thực, phân quyền (Login / Register / JWT).
2. **feature/api-crud-san-pham-danh-muc:** API RESTful CRUD sản phẩm & danh mục.
3. **feature/storefront-catalog:** Giao diện khách hàng (Trang chủ, danh mục, tìm kiếm/lọc, chi tiết).
4. **feature/shopping-cart:** Tính năng giỏ hàng (thêm, cập nhật số lượng, xóa, tính tổng tiền, kiểm kho).
5. **feature/order-workflow:** Quy trình đặt hàng COD, trừ kho tự động trong Transaction, xem lịch sử và hủy đơn.
6. **feature/admin-dashboard:** Giao diện Admin quản trị sản phẩm, danh mục, đơn hàng, khách hàng và thống kê.
7. **test/api-business-flows:** Kịch bản kiểm thử, file Postman Collection và dữ liệu seed mẫu.
8. **docs/project-report-demo:** Tài liệu đặc tả, bản thiết kế CSDL, ERD và báo cáo đồ án.

---

## 4. Kịch bản Demo ứng dụng (Demo Script)

### Bước 1: Khởi động hệ thống
- Chạy backend: cd backend && npm start (lắng nghe tại http://localhost:5000).
- Mở trình duyệt truy cập: http://localhost:5000.

### Bước 2: Luồng Khách hàng (Customer Journey)
1. **Khám phá sản phẩm:** Truy cập trang chủ, xem banner, danh mục sản phẩm nổi bật.
2. **Tìm kiếm & lọc:** Chuyển sang trang Sản phẩm (products.html), nhập từ khóa, lọc theo mức giá và danh mục.
3. **Xem chi tiết sản phẩm:** Xem chi tiết sản phẩm, tồn kho, giá bán và đánh giá.
4. **Đăng nhập:** Đăng nhập với tài khoản customer@shopease.com / Customer@123.
5. **Quản lý giỏ hàng:** Nhấn 'Thêm vào giỏ hàng', vào cart.html cập nhật số lượng.
6. **Đặt hàng COD:** Điền thông tin giao hàng, chọn COD và xác nhận đặt hàng.
7. **Xem lịch sử & hủy đơn:** Vào orders.html kiểm tra đơn hàng PENDING và thử nghiệm hủy đơn.

### Bước 3: Luồng Quản trị viên (Admin Journey)
1. **Đăng nhập Admin:** Truy cập http://localhost:5000/admin/login.html với admin@shopease.com / Admin@123.
2. **Dashboard thống kê:** Xem tổng quan doanh thu, số đơn hàng, sản phẩm, người dùng.
3. **Quản trị sản phẩm & danh mục:** Thêm, sửa, đổi trạng thái kinh doanh.
4. **Quản trị đơn hàng:** Cập nhật trạng thái đơn (PENDING -> PROCESSING -> SHIPPED -> COMPLETED).
5. **Quản lý người dùng:** Xem danh sách người dùng và trạng thái tài khoản.
