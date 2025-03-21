# Node Web Crawler cho n8n

Node tùy chỉnh cho n8n giúp cào dữ liệu từ trang web, trích xuất nội dung văn bản và liên kết hình ảnh, lọc hình ảnh theo kích thước và lưu trữ bài viết vào cơ sở dữ liệu.

## Mô tả

Node này cho phép:
- Truy cập vào một URL bất kỳ
- Trích xuất nội dung văn bản từ trang web đó
- Trích xuất và lọc hình ảnh theo kích thước (chiều rộng hoặc chiều cao)
- Lấy bài viết ngẫu nhiên từ trang web và lưu vào cơ sở dữ liệu MySQL hoặc PostgreSQL
- Truy xuất bài viết đã lưu từ cơ sở dữ liệu

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

### Kết quả đầu ra:

#### Khi Cào Dữ Liệu Trang Web:

```json
{
  "url": "https://example.com",
  "textContent": "Nội dung văn bản từ trang web",
  "imageLinks": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "imageCount": 2,
  "filterDetails": {
    "filtered": true,
    "minImageSize": 300,
    "originalCount": 5,
    "filteredCount": 2
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
    "content": "Nội dung bài viết..."
  },
  "database": {
    "success": true,
    "id": "article_1647867542123_456",
    "type": "mysql"
  },
  "message": "Đã lưu bài viết \"Tiêu đề bài viết\" vào cơ sở dữ liệu mysql"
}
```

## Ví dụ workflow

1. Sử dụng node "Web Crawler" để cào dữ liệu từ một trang tin tức, lọc hình ảnh lớn hơn 500px
2. Sử dụng node "HTTP Request" để tải xuống những hình ảnh đã lọc
3. Hoặc sử dụng thao tác "Lấy Bài Viết Ngẫu Nhiên" để lấy nội dung và lưu vào cơ sở dữ liệu

## Lưu ý

- Một số trang web có thể chặn các yêu cầu cào dữ liệu, vì vậy hãy cân nhắc sử dụng proxy hoặc User-Agent tùy chỉnh nếu cần
- Luôn tuân thủ các quy tắc và điều khoản sử dụng của trang web khi cào dữ liệu
- Việc kiểm tra kích thước thực tế của hình ảnh sẽ làm chậm quá trình xử lý do phải tải mỗi hình ảnh
- Đảm bảo chuỗi kết nối đến cơ sở dữ liệu chính xác để tránh lỗi khi lưu trữ bài viết 