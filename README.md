# Node Web Crawler cho n8n

Node tùy chỉnh cho n8n giúp cào dữ liệu từ trang web, trích xuất nội dung văn bản và liên kết hình ảnh.

## Mô tả

Node này cho phép:
- Truy cập vào một URL bất kỳ
- Trích xuất nội dung văn bản từ trang web đó
- Trích xuất tất cả các liên kết hình ảnh có trong trang

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

### Tham số:

1. **URL**: URL của trang web cần cào dữ liệu
2. **Selector cho nội dung văn bản**: CSS selector cho phần tử chứa nội dung văn bản (mặc định: `body`)
3. **Selector cho hình ảnh**: CSS selector cho các phần tử hình ảnh (mặc định: `img`)

### Kết quả đầu ra:

```json
{
  "url": "https://example.com",
  "textContent": "Nội dung văn bản từ trang web",
  "imageLinks": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "imageCount": 2
}
```

## Ví dụ workflow

1. Sử dụng node "Web Crawler" để cào dữ liệu từ một trang tin tức
2. Sử dụng node "Filter" để lọc các hình ảnh theo kích thước hoặc tên
3. Sử dụng node "HTTP Request" để tải xuống những hình ảnh đã lọc

## Lưu ý

- Một số trang web có thể chặn các yêu cầu cào dữ liệu, vì vậy hãy cân nhắc sử dụng proxy hoặc User-Agent tùy chỉnh nếu cần
- Luôn tuân thủ các quy tắc và điều khoản sử dụng của trang web khi cào dữ liệu 