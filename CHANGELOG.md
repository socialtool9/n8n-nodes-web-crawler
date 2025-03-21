# Changelog

Tất cả các thay đổi đáng chú ý của dự án sẽ được ghi lại trong file này.

## [1.2.0] - 2024-03-21

### Thêm mới
- Tính năng lọc hình ảnh theo kích thước
- Hỗ trợ kiểm tra kích thước thực tế của hình ảnh bằng cách tải hình ảnh và đo kích thước
- Thêm tùy chọn để chỉ định kích thước tối thiểu (mặc định 300px)

### Thay đổi
- Cải thiện phương thức chuẩn hóa đường dẫn hình ảnh
- Bổ sung thông tin chi tiết trong kết quả đầu ra về số lượng hình ảnh trước và sau khi lọc

### Cố định
- Sửa lỗi khi xác thực chuỗi kết nối đến cơ sở dữ liệu

## [1.1.0] - 2024-03-20

### Thêm mới
- Thêm tính năng lưu trữ bài viết vào cơ sở dữ liệu MySQL và PostgreSQL
- Hỗ trợ truy xuất bài viết từ cơ sở dữ liệu theo ID
- Tự động tạo bảng nếu chưa tồn tại
- Thêm thao tác "Lấy Bài Viết Ngẫu Nhiên" và "Lấy Bài Viết Từ Cơ Sở Dữ Liệu"

### Thay đổi
- Cải thiện cấu trúc code với phương thức static để xử lý cơ sở dữ liệu

## [1.0.1] - 2024-03-19

### Cố định
- Sửa lỗi khi xử lý đường dẫn tương đối của hình ảnh
- Cải thiện xử lý lỗi khi không thể kết nối đến URL

## [1.0.0] - 2024-03-18

### Thêm mới
- Phiên bản đầu tiên với tính năng cào dữ liệu cơ bản
- Hỗ trợ trích xuất nội dung văn bản từ trang web
- Hỗ trợ trích xuất liên kết hình ảnh từ trang web
- Tạo cấu trúc node tùy chỉnh cho n8n 