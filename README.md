# Node Web Crawler cho n8n (v1.4.0)

Node tùy chỉnh cho n8n giúp cào dữ liệu từ trang web, trích xuất nội dung văn bản và liên kết hình ảnh, lọc hình ảnh theo kích thước và lưu trữ bài viết vào cơ sở dữ liệu.

## Mô tả

Node này cho phép:
- Truy cập vào một URL bất kỳ
- Trích xuất nội dung văn bản từ trang web đó
- Trích xuất và lọc hình ảnh theo kích thước (chiều rộng hoặc chiều cao)
- Lấy bài viết ngẫu nhiên từ trang web và lưu vào cơ sở dữ liệu MySQL hoặc PostgreSQL
- Truy xuất bài viết đã lưu từ cơ sở dữ liệu
- Cập nhật trạng thái bài viết (pending/done/skipped) để quản lý tiến trình xử lý
- Tìm kiếm ảnh từ Google theo từ khóa để sử dụng trong bài viết

## Cài đặt

Để cài đặt node này cho n8n, bạn cần:

1. Cài đặt project:
```
npm install
```

2. Build project:
```
npm run build
```

3. Tạo liên kết symbolic:
```
npm link
```

4. Từ thư mục cài đặt n8n, liên kết với node này:
```
cd ~/.n8n
npm link n8n-nodes-web-crawler
```

## Sử dụng

Sau khi cài đặt, node "Web Crawler" sẽ xuất hiện trong danh sách các node có sẵn trong n8n.

### Các thao tác:

1. **Cào Dữ Liệu Trang Web**: Trích xuất văn bản và hình ảnh từ trang web
2. **Lấy Bài Viết Ngẫu Nhiên**: Lấy ngẫu nhiên một bài viết từ trang web và lưu vào cơ sở dữ liệu
3. **Lấy Bài Viết Từ Cơ Sở Dữ Liệu**: Truy xuất bài viết đã lưu dựa trên ID
4. **Cập Nhật Trạng Thái Bài Viết**: Cập nhật trạng thái bài viết trong cơ sở dữ liệu
5. **Tìm Kiếm Ảnh Google**: Tìm kiếm và lấy ảnh từ Google theo từ khóa

### Tham số cho Cào Dữ Liệu Trang Web:

1. **URL**: URL của trang web cần cào dữ liệu
2. **Selector cho nội dung văn bản**: CSS selector cho phần tử chứa nội dung văn bản (mặc định: `body`)
3. **Selector cho hình ảnh**: CSS selector cho các phần tử hình ảnh (mặc định: `img`)
4. **Lọc hình ảnh theo kích thước**: Bật/tắt tính năng lọc hình ảnh
5. **Kích thước tối thiểu (px)**: Chỉ lấy hình ảnh có chiều rộng hoặc chiều cao lớn hơn giá trị này (mặc định: 300px)
6. **Kiểm tra kích thước thực tế**: Tải hình ảnh để kiểm tra kích thước thực (chậm hơn nhưng chính xác hơn)

### Tham số cho Lấy Bài Viết Ngẫu Nhiên:

1. **URL**: URL của trang web cần lấy bài viết
2. **Selector cho bài viết**: CSS selector cho các phần tử bài viết
3. **Selector cho tiêu đề**: CSS selector cho tiêu đề bài viết
4. **Selector cho liên kết**: CSS selector cho liên kết bài viết
5. **Loại cơ sở dữ liệu**: MySQL hoặc PostgreSQL
6. **Kết nối cơ sở dữ liệu**: Chuỗi kết nối đến cơ sở dữ liệu
7. **Tên bảng**: Tên bảng lưu trữ bài viết
8. **Tạo bảng nếu chưa tồn tại**: Tự động tạo bảng nếu chưa có

### Tham số cho Lấy Bài Viết Từ Cơ Sở Dữ Liệu:

1. **Loại cơ sở dữ liệu**: MySQL hoặc PostgreSQL
2. **Kết nối cơ sở dữ liệu**: Chuỗi kết nối đến cơ sở dữ liệu
3. **Tên bảng**: Tên bảng lưu trữ bài viết
4. **ID Bài Viết**: ID của bài viết cần lấy

### Tham số cho Cập Nhật Trạng Thái Bài Viết:

1. **Loại cơ sở dữ liệu**: MySQL hoặc PostgreSQL
2. **Kết nối cơ sở dữ liệu**: Chuỗi kết nối đến cơ sở dữ liệu
3. **Tên bảng**: Tên bảng lưu trữ bài viết
4. **ID Bài Viết**: ID của bài viết cần cập nhật trạng thái
5. **Trạng thái mới**: Trạng thái mới cho bài viết (Chưa xử lý/Đã xử lý/Đã bỏ qua)

### Tham số cho Tìm Kiếm Ảnh Google:

1. **Từ khóa tìm kiếm**: Từ khóa để tìm kiếm ảnh trên Google
2. **Số lượng ảnh tối đa**: Số lượng ảnh muốn lấy về (mặc định: 5)
3. **Lọc ảnh theo kích thước**: Bật/tắt tính năng lọc ảnh theo kích thước
4. **Kích thước tối thiểu (px)**: Chỉ lấy ảnh có chiều rộng hoặc chiều cao lớn hơn giá trị này (mặc định: 500px)

### Kết quả đầu ra:

#### Khi Cào Dữ Liệu Trang Web:

```json
{
  "url": "https://example.com",
  "textContent": "Nội dung văn bản từ trang web",
  "imageLinks": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "data:image/png;base64,..."
  ],
  "imageCount": 3,
  "filterDetails": {
    "filtered": true,
    "minImageSize": 300,
    "originalCount": 10,
    "filteredCount": 3,
    "skippedForSize": 5,
    "skippedBase64Icons": 2
  }
}
```

#### Khi Lấy Bài Viết Ngẫu Nhiên:

```json
{
  "operation": "randomArticle",
  "databaseType": "mysql",
  "articleId": "article_1647867542123_456",
  "tableName": "web_articles",
  "article": {
    "title": "Tiêu đề bài viết",
    "link": "https://example.com/article",
    "content": "Nội dung bài viết...",
    "status": "pending"
  },
  "database": {
    "success": true,
    "id": "article_1647867542123_456",
    "type": "mysql"
  },
  "message": "Đã lưu bài viết \"Tiêu đề bài viết\" vào cơ sở dữ liệu mysql"
}
```

#### Khi Cập Nhật Trạng Thái Bài Viết:

```json
{
  "operation": "updateArticleStatus",
  "databaseType": "mysql",
  "tableName": "web_articles",
  "articleId": "article_1647867542123_456",
  "status": "done",
  "success": true,
  "article": {
    "id": "article_1647867542123_456",
    "title": "Tiêu đề bài viết",
    "link": "https://example.com/article",
    "content": "Nội dung bài viết...",
    "status": "done",
    "created_at": "2024-03-21T10:15:30Z",
    "updated_at": "2024-03-21T11:20:45Z"
  },
  "message": "Đã cập nhật trạng thái của bài viết thành \"done\""
}
```

#### Khi Tìm Kiếm Ảnh Google:

```json
{
  "operation": "googleImageSearch",
  "keyword": "phong cảnh đẹp Việt Nam",
  "imageCount": 5,
  "requestedCount": 5,
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg",
    "https://example.com/image4.jpg",
    "https://example.com/image5.jpg"
  ],
  "imagesInfo": [
    {
      "url": "https://example.com/image1.jpg",
      "width": 1200,
      "height": 800
    },
    // ... thông tin các ảnh khác
  ],
  "filterDetails": {
    "filtered": true,
    "minImageSize": 500,
    "totalFound": 25,
    "processedCount": 5,
    "skipped": {
      "small": 8,
      "error": 3
    }
  }
}
```

## Ví dụ workflow

1. Sử dụng node "Web Crawler" để cào dữ liệu từ một trang tin tức, lọc hình ảnh lớn hơn 500px
2. Sử dụng node "HTTP Request" để tải xuống những hình ảnh đã lọc
3. Sử dụng thao tác "Lấy Bài Viết Ngẫu Nhiên" để lấy nội dung và lưu vào cơ sở dữ liệu
4. Xử lý và đăng bài viết lên nền tảng của bạn bằng các node khác
5. Sau khi đăng xong, sử dụng thao tác "Cập Nhật Trạng Thái Bài Viết" để đánh dấu bài viết là "done"
6. Sử dụng thao tác "Tìm Kiếm Ảnh Google" để tìm ảnh liên quan đến nội dung bài viết, làm phong phú thêm nội dung

## Lưu ý

- Một số trang web có thể chặn các yêu cầu cào dữ liệu, vì vậy hãy cân nhắc sử dụng proxy hoặc User-Agent tùy chỉnh nếu cần
- Luôn tuân thủ các quy tắc và điều khoản sử dụng của trang web khi cào dữ liệu
- Việc kiểm tra kích thước thực tế của hình ảnh sẽ làm chậm quá trình xử lý do phải tải mỗi hình ảnh
- Đảm bảo chuỗi kết nối đến cơ sở dữ liệu chính xác để tránh lỗi khi lưu trữ bài viết
- Bài viết với trạng thái "done" đã được xử lý và nên bỏ qua, giúp tránh đăng trùng lặp 

## Phát triển và kiểm thử

Node Crawler này bao gồm bộ test hiện đại để đảm bảo tính ổn định của các chức năng chính:

```bash
# Chạy bộ test
npm test
```

Bộ test bao gồm:
- Kiểm thử thao tác cào dữ liệu trang web
- Kiểm thử thao tác lấy bài viết ngẫu nhiên
- Kiểm thử các thao tác truy vấn và cập nhật cơ sở dữ liệu

## Cập nhật mới nhất (v1.4.0)

Trong phiên bản 1.4.0, chúng tôi đã thêm:
- Thao tác "Tìm Kiếm Ảnh Google" cho phép tìm kiếm ảnh theo từ khóa
- Hỗ trợ lọc ảnh theo kích thước cho kết quả tìm kiếm
- Tùy chọn giới hạn số lượng ảnh tải về
- Thông tin chi tiết về kích thước của từng ảnh tìm được

## Các bản cập nhật trước

### Phiên bản 1.3.4
- Cập nhật biểu tượng cho node n8n
- Tối ưu hóa hiệu suất cào dữ liệu

### Phiên bản 1.3.3
- Thêm biểu tượng cho node n8n
- Bộ kiểm thử cho thao tác randomArticle
- Sửa lỗi TypeScript trong các file test
- Tối ưu hóa quy trình kiểm thử với mocks chính xác hơn