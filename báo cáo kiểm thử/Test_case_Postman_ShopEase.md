# Báo cáo kiểm thử API ShopEase

## 1. Thông tin kiểm thử

- **Phạm vi:** đăng ký/đăng nhập, giỏ hàng/đặt hàng/hủy đơn, phân quyền, JWT và kiểm tra input cơ bản.
- **Địa chỉ kiểm thử:** `http://localhost:5000/api`
- **Môi trường:** API cục bộ kết nối MySQL; dữ liệu mẫu có sẵn.
- **Cách chạy:** gửi HTTP request tới API cục bộ. Chưa chạy trong giao diện Postman vì máy kiểm thử không có Postman/Newman CLI; collection có thể import để chạy lại trong Postman.
- **Kết quả:** 25 request kiểm tra (gồm health check và bước chuẩn bị fixture), **24 đạt / 1 không đạt**.

## 2. Bảng test case và kết quả

| ID | Luồng / dữ liệu kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---:|---:|---|
| TC-01 | Health check và kết nối database | HTTP 200, `database=connected` | 200, connected | Đạt |
| TC-02 | Lấy danh sách sản phẩm công khai | HTTP 200 | 200 | Đạt |
| TC-03 | Đăng ký với email sai định dạng | HTTP 400 | 400 | Đạt |
| TC-04 | Đăng ký với `password` là số thay vì chuỗi | HTTP 400 | HTTP 500 | **Không đạt** |
| TC-05 | Đăng ký khách hàng mới với dữ liệu hợp lệ | HTTP 201, có JWT; không trả `password_hash` | 201; token có; không lộ hash | Đạt |
| TC-06 | Đăng nhập bằng mật khẩu sai | HTTP 401 | 401 | Đạt |
| TC-07 | Đăng nhập bằng mật khẩu đúng | HTTP 200, có JWT | 200 | Đạt |
| TC-08 | Gọi hồ sơ không gửi JWT | HTTP 401 | 401 | Đạt |
| TC-09 | Gọi hồ sơ với JWT không hợp lệ | HTTP 401 | 401 | Đạt |
| TC-10 | Gọi hồ sơ với JWT hợp lệ | HTTP 200 | 200 | Đạt |
| TC-11 | Tài khoản CUSTOMER gọi API quản trị | HTTP 403 | 403 | Đạt |
| TC-12 | Tạo/đọc fixture khách hàng thứ hai để kiểm tra phân lập dữ liệu | HTTP 201 / 200 | 201 / 200 | Đạt |
| TC-13 | Đọc giỏ hàng khách hàng mới | HTTP 200, giỏ trống | 200, giỏ trống | Đạt |
| TC-14 | Thêm sản phẩm còn hàng vào giỏ | HTTP 200 | 200 | Đạt |
| TC-15 | Thêm số lượng vượt tồn kho | HTTP 400 | 400 | Đạt |
| TC-16 | Checkout từ giỏ hàng hợp lệ | HTTP 201, tạo đơn | 201 | Đạt |
| TC-17 | Chủ đơn xem đơn của mình | HTTP 200 | 200 | Đạt |
| TC-18 | Khách hàng khác xem đơn không thuộc mình | HTTP 404 | 404 | Đạt |
| TC-19 | Khách hàng khác hủy đơn | HTTP 403 | 403 | Đạt |
| TC-20 | Chủ đơn hủy đơn PENDING | HTTP 200; hoàn tồn kho | 200; giỏ đã được làm trống sau checkout | Đạt |
| TC-21 | Hủy lại đơn đã CANCELLED | HTTP 400 | 400 | Đạt |
| TC-22 | Giỏ hàng trống sau khi checkout | HTTP 200 | 200 | Đạt |
| TC-23 | Đăng nhập Admin bằng tài khoản môi trường mẫu | HTTP 200 | 200 | Đạt |
| TC-24 | Truy vấn danh sách QA làm fixture kiểm thử | HTTP 200 | 200 | Đạt |
| TC-25 | Admin truy cập thống kê quản trị | HTTP 200 | 200 | Đạt |

## 3. Phát hiện cần xử lý

### BUG-01 — Kiểu dữ liệu mật khẩu không được kiểm tra trước khi băm

- **Mức độ:** Trung bình.
- **Bằng chứng:** gửi JSON đăng ký với `password: 12345678` trả HTTP 500, trong khi dữ liệu không hợp lệ nên được từ chối bằng HTTP 400.
- **Nguyên nhân có khả năng:** controller sử dụng `password.length` và gọi `bcrypt.hash` mà chưa xác nhận `password` là chuỗi.
- **Khuyến nghị:** kiểm tra `typeof password === 'string'` và dữ liệu chuỗi trước các phép kiểm tra độ dài/băm; thêm test hồi quy cho `null`, số, mảng và object.

### SEC-01 — JWT secret mặc định có thể bị dùng ngoài môi trường phát triển

- **Mức độ:** Cao nếu cấu hình này được triển khai nguyên trạng.
- **Bằng chứng rà soát mã:** cấu hình JWT có giá trị fallback cố định `shopease_dev_secret` khi thiếu `JWT_SECRET`.
- **Khuyến nghị:** bắt buộc cấu hình secret ngẫu nhiên qua biến môi trường và dừng khởi động nếu thiếu trong production; không dùng fallback mặc định ở production.
- **Lưu ý:** đây là phát hiện rà soát cấu hình, không phải phép thử khai thác.

## 4. Ghi chú kết quả bảo mật

- Luồng đăng ký/đăng nhập sử dụng `bcrypt.hash` và `bcrypt.compare`; kiểm tra thực tế xác nhận mật khẩu đúng đăng nhập được, mật khẩu sai bị từ chối.
- Token thiếu/sai bị từ chối; JWT hợp lệ được chấp nhận; tài khoản CUSTOMER không truy cập được endpoint Admin.
- Response đăng ký không chứa trường `password_hash`.
- SQL injection không được kiểm thử chuyên sâu; nên bổ sung kiểm thử bảo mật có kiểm soát trước khi phát hành.

## 5. Dữ liệu kiểm thử

Các request đăng ký/đặt hàng đã tạo tài khoản và đơn thử nghiệm trong database cục bộ. Những đơn này đã được hủy qua API, do đó luồng hoàn tồn kho được kích hoạt; tài khoản thử nghiệm vẫn còn vì API hiện không có endpoint xóa tài khoản. Không chạy collection trên production hoặc database dùng chung.

## 6. Chạy lại bằng Postman

1. Import [ShopEase_Postman_Collection.json](./ShopEase_Postman_Collection.json).
2. Đặt `baseUrl` là `http://localhost:5000/api`.
3. Chạy collection theo thứ tự; các tài khoản QA được tạo tự động với email duy nhất, checkout và hủy đơn được thực hiện trong collection.
4. Để chạy request kiểm tra quyền Admin, điền `adminEmail` và `adminPassword` trong Collection Variables theo tài khoản của môi trường local. Không lưu thông tin production trong collection.
5. Test `TC-04` hiện được thiết kế để mong HTTP 400 và sẽ thất bại với phiên bản API hiện tại cho đến khi lỗi validate được sửa.
