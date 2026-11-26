/**
 * ShopEase - Du lieu mau (seed).
 * Chay: npm run seed
 * - Tao lai database + bang (theo schema.sql)
 * - Them tai khoan Admin + Customer, danh muc, san pham, don hang mau, danh gia.
 *
/** */
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const env = require("./config/env");

async function main() {
  const schema = fs.readFileSync(
    path.join(__dirname, "..", "database", "schema.sql"),
    "utf8",
  );

  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    charset: "utf8mb4",
    multipleStatements: true,
  });

  try {
    console.log("[1/5] Tao lai database va cac bang...");
    await conn.query("DROP DATABASE IF EXISTS shopease_db");
    await conn.query(schema);
    console.log("      OK");

    console.log("[2/5] Them tai khoan nguoi dung...");
    const adminHash = await bcrypt.hash("Admin@123", 10);
    const customerHash = await bcrypt.hash("Customer@123", 10);

    const [adminRes] = await conn.query(
      "INSERT INTO users (full_name, email, password_hash, position) VALUES (?, ?, ?, 'ADMIN')",
      ["Quản trị viên", "admin@shopease.com", adminHash],
    );
    const adminId = adminRes.insertId;

    const [customerRes] = await conn.query(
      "INSERT INTO users (full_name, email, password_hash, position, phone, address) VALUES (?, ?, ?, 'CUSTOMER', ?, ?)",
      [
        "Nguyễn Văn A",
        "customer@shopease.com",
        customerHash,
        "0901234567",
        "123 Đường Lê Lợi, Quận 1, TP.HCM",
      ],
    );
    const customerId = customerRes.insertId;
    await conn.query("INSERT INTO carts (user_id) VALUES (?)", [customerId]);
    console.log("      OK (admin + customer)");

    console.log("[3/5] Them danh muc va san pham...");
    const categoryNames = [
      "Điện thoại",
      "Laptop",
      "Máy tính bảng",
      "Phụ kiện",
      "Đồ gia dụng",
    ];
    const categoryIds = {};
    for (const name of categoryNames) {
      const [r] = await conn.query("INSERT INTO categories (name) VALUES (?)", [
        name,
      ]);
      categoryIds[name] = r.insertId;
    }

    const products = [
      [
        "Điện thoại",
        "iPhone 15 Pro Max 256GB",
        "Điện thoại cao cấp với chip A17 Pro, camera 48MP, màn hình Super Retina XDR.",
        29990000,
        15,
        "https://bachlongstore.vn/vnt_upload/product/10_2023/iii.png",
      ],
      [
        "Điện thoại",
        "Samsung Galaxy S24 Ultra",
        "Flagship Android với bút S Pen, camera 200MP và Galaxy AI thông minh.",
        26990000,
        20,
        "https://i.hoanghamobile.vn/Uploads/2026/08/21/sm-s741-galaxys26fe-front-graphite-115909936.png;p=zoom",
      ],
      [
        "Điện thoại",
        "Xiaomi Redmi Note 13",
        "Điện thoại tầm trung pin 5000mAh, camera 108MP, màn hình AMOLED 120Hz.",
        5490000,
        50,
        "https://i02.appmifile.com/93_operator_sg/11/01/2024/267ea5e83a7ce34dc169610d6d853709.png",
      ],
      [
        "Laptop",
        "MacBook Air M2 13 inch",
        "Laptop mỏng nhẹ chip M2, pin đến 18 giờ, màn hình Liquid Retina.",
        24990000,
        10,
        "https://macone.vn/wp-content/uploads/2024/03/mba13-m3-midnight-gallery1-202402.jpeg",
      ],
      [
        "Laptop",
        "Dell Inspiron 15",
        "Laptop văn phòng màn hình 15.6 inch, CPU Intel Core i5, RAM 16GB.",
        15490000,
        12,
        "https://images-na.ssl-images-amazon.com/images/I/61zRDADh+YS.jpg",
      ],
      [
        "Laptop",
        "ASUS Vivobook 14",
        "Laptop học tập - văn phòng gọn nhẹ, hiệu năng ổn định, màn hình chống lóa.",
        13990000,
        18,
        "https://img.tgdd.vn/imgt/ecom/f_webp,fit_outside,quality_100,s_1290x738/https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/369449/asus-vivobook-14-x1404ma-eb028w-core-5-320-16gb-512gb-full-hd-win11-6-639198058902029696.jpg",
      ],
      [
        "Máy tính bảng",
        "iPad Air 5",
        "Máy tính bảng chip M1, hỗ trợ Apple Pencil 2 và bàn phím Magic Keyboard.",
        14990000,
        8,
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIJ2PMrnqlazG8z8gh55NRkkA_pPr1LvcwL5TUeQwqbfHTmvwYM2kQ0aRx&s=10",
      ],
      [
        "Máy tính bảng",
        "Samsung Galaxy Tab S9",
        "Tablet Android cao cấp, màn hình AMOLED 120Hz, kèm S Pen.",
        16990000,
        6,
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Phụ kiện",
        "Tai nghe AirPods Pro 2",
        "Tai nghe không dây chống ồn chủ động, chip H2, âm thanh sống động.",
        5990000,
        40,
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Phụ kiện",
        "Cáp sạc nhanh USB-C 100W",
        "Cáp sạc nhanh bền bỉ, hỗ trợ công suất lên đến 100W, dài 2m.",
        199000,
        200,
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Phụ kiện",
        "Chuột không dây Logitech MX Master 3S",
        "Chuột không dây công thái học, cảm biến 8K DPI và cuộn MagSpeed.",
        2490000,
        25,
        "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Phụ kiện",
        "Bàn phím cơ Keychron K2",
        "Bàn phím cơ không dây nhỏ gọn, kết nối Bluetooth và USB-C.",
        2190000,
        30,
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Phụ kiện",
        "Sạc dự phòng Anker 20000mAh",
        "Pin sạc dự phòng dung lượng 20000mAh, hỗ trợ sạc nhanh USB-C.",
        1290000,
        45,
        "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Phụ kiện",
        "Loa Bluetooth JBL Flip 6",
        "Loa Bluetooth chống nước IP67, âm thanh stereo mạnh mẽ.",
        2990000,
        20,
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Đồ gia dụng",
        "Máy lọc không khí Xiaomi",
        "Lọc bụi mịn PM2.5, cảm biến thông minh, phù hợp phòng đến 48m2.",
        2990000,
        30,
        "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Đồ gia dụng",
        "Ấm đun nước siêu tốc 1.8L",
        "Ấm đun nước nhanh, thân inox 304, tự ngắt khi sôi.",
        399000,
        80,
        "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Đồ gia dụng",
        "Nồi chiên không dầu Philips 4.1L",
        "Nồi chiên không dầu công nghệ Rapid Air, dung tích 4.1 lít.",
        3290000,
        15,
        "https://images.unsplash.com/photo-1556911261-6bd341186b2f?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Đồ gia dụng",
        "Robot hút bụi Xiaomi Vacuum S10",
        "Robot hút bụi lau nhà với điều hướng laser LDS và bản đồ thông minh.",
        5990000,
        10,
        "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Điện thoại",
        "Samsung Galaxy A55 5G",
        "Điện thoại màn hình Super AMOLED 120Hz, camera 50MP và kết nối 5G.",
        9990000,
        22,
        "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Laptop",
        "Lenovo IdeaPad Slim 5",
        "Laptop mỏng nhẹ với màn hình 14 inch, RAM 16GB và SSD tốc độ cao.",
        18990000,
        14,
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Điện thoại",
        "Google Pixel 9 128GB",
        "Điện thoại Android với camera thông minh, màn hình OLED và các tính năng AI.",
        21990000,
        12,
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Điện thoại",
        "OPPO Reno12 5G",
        "Điện thoại 5G thiết kế mỏng nhẹ, camera chân dung và sạc nhanh.",
        12490000,
        24,
        "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Điện thoại",
        "Samsung Galaxy Z Flip6 256GB",
        "Điện thoại gập nhỏ gọn với màn hình FlexWindow và camera 50MP.",
        28990000,
        8,
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Laptop",
        "HP Pavilion 15",
        "Laptop 15.6 inch phục vụ học tập và văn phòng, RAM 16GB, SSD 512GB.",
        16990000,
        11,
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Laptop",
        "Acer Nitro V 15",
        "Laptop gaming với đồ họa rời, màn hình tần số quét cao và tản nhiệt hiệu quả.",
        22990000,
        9,
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Máy tính bảng",
        "Xiaomi Pad 6 256GB",
        "Máy tính bảng màn hình 11 inch 144Hz, phù hợp giải trí và học tập.",
        8990000,
        16,
        "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Phụ kiện",
        "Ổ cứng di động Samsung T7 1TB",
        "Ổ cứng SSD di động nhỏ gọn, tốc độ truyền dữ liệu cao qua USB-C.",
        2490000,
        28,
        "https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Phụ kiện",
        "Camera an ninh TP-Link Tapo C220",
        "Camera trong nhà xoay 360 độ, hỗ trợ quan sát ban đêm và phát hiện chuyển động.",
        899000,
        35,
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Đồ gia dụng",
        "Máy hút bụi cầm tay Deerma DX115C",
        "Máy hút bụi nhỏ gọn cho gia đình, có đầu hút khe và bộ lọc bụi.",
        699000,
        32,
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      ],
      [
        "Đồ gia dụng",
        "Máy pha cà phê Delonghi EC685",
        "Máy pha cà phê espresso nhỏ gọn, hỗ trợ pha cà phê bột và viên nén.",
        6490000,
        7,
        "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
      ],
    ];

    const productIds = {};
    for (const [cat, name, desc, price, stock, imageUrl = null] of products) {
      const [r] = await conn.query(
        "INSERT INTO products (category_id, name, description, price, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)",
        [categoryIds[cat], name, desc, price, stock, imageUrl],
      );
      productIds[name] = r.insertId;
    }
    console.log(`      OK (${products.length} san pham)`);

    console.log("[4/5] Them don hang mau...");
    // Don hang 1 - COMPLETED (tru ton kho)
    const [order1] = await conn.query(
      `INSERT INTO orders (order_code, user_id, recipient_name, recipient_phone, shipping_address, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED')`,
      [
        "ORD20261110001",
        customerId,
        "Nguyễn Văn A",
        "0901234567",
        "123 Đường Lê Lợi, Quận 1, TP.HCM",
        35980000,
      ],
    );
    await conn.query(
      "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
      [order1.insertId, productIds["iPhone 15 Pro Max 256GB"], 1, 29990000],
    );
    await conn.query(
      "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
      [order1.insertId, productIds["Tai nghe AirPods Pro 2"], 1, 5990000],
    );

    // Don hang 2 - PENDING
    const [order2] = await conn.query(
      `INSERT INTO orders (order_code, user_id, recipient_name, recipient_phone, shipping_address, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        "ORD20261111002",
        customerId,
        "Nguyễn Văn A",
        "0901234567",
        "123 Đường Lê Lợi, Quận 1, TP.HCM",
        797000,
      ],
    );
    await conn.query(
      "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
      [order2.insertId, productIds["Cáp sạc nhanh USB-C 100W"], 2, 199000],
    );
    await conn.query(
      "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
      [order2.insertId, productIds["Ấm đun nước siêu tốc 1.8L"], 1, 399000],
    );

    // Giam ton kho tuong ung
    const decrements = [
      ["iPhone 15 Pro Max 256GB", 1],
      ["Tai nghe AirPods Pro 2", 1],
      ["Cáp sạc nhanh USB-C 100W", 2],
      ["Ấm đun nước siêu tốc 1.8L", 1],
    ];
    for (const [name, qty] of decrements) {
      await conn.query(
        "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
        [qty, productIds[name]],
      );
    }
    console.log("      OK (2 don hang)");

    console.log("[5/5] Them danh gia mau...");
    const reviews = [
      [
        customerId,
        productIds["iPhone 15 Pro Max 256GB"],
        5,
        "Sản phẩm tuyệt vời, đóng gói cẩn thận, giao hàng nhanh.",
      ],
      [
        customerId,
        productIds["Tai nghe AirPods Pro 2"],
        4,
        "Âm thanh tốt, chống ồn ấn tượng.",
      ],
      [
        customerId,
        productIds["MacBook Air M2 13 inch"],
        5,
        "Máy mỏng nhẹ, mượt, pin rất trâu.",
      ],
    ];
    for (const [uid, pid, rating, comment] of reviews) {
      await conn.query(
        "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)",
        [uid, pid, rating, comment],
      );
    }
    console.log("      OK");

    console.log("\n==============================================");
    console.log("  Seed hoan tat! Tai khoan demo:");
    console.log("  Admin    : admin@shopease.com    / Admin@123");
    console.log("  Customer : customer@shopease.com / Customer@123");
    console.log("==============================================");
  } catch (err) {
    console.error("Loi khi seed du lieu:", err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
