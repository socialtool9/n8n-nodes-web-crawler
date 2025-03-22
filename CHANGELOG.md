# Changelog

Tất cả các thay đổi đáng chú ý của dự án sẽ được ghi lại trong file này.

## [1.5.5] - 2024-03-28

### Thêm mới
- Bổ sung test toàn diện cho chức năng lấy bài viết ngẫu nhiên với hỗ trợ phân trang
- Mở rộng test cho tính năng proxy trong cả hai chức năng lấy bài viết và tìm kiếm ảnh
- Thêm test cho xử lý timeout trong các trường hợp khác nhau

### Cập nhật
- Cải thiện độ phủ kiểm thử, đặc biệt cho các tính năng mới
- Tối ưu hóa cấu trúc test và giảm trùng lặp code
- Tăng cường kiểm tra xử lý lỗi trong quá trình cào dữ liệu

## [1.5.4] - 2024-03-27

### Thêm mới
- Thêm tính năng truy cập nhiều trang (pagination) cho chức năng lấy bài viết ngẫu nhiên
- Hỗ trợ danh sách proxy cho cả chức năng lấy bài viết ngẫu nhiên và tìm kiếm ảnh Google
- Thêm tùy chọn timeout cho các request, tự động trả về kết quả rỗng nếu quá thời gian

### Cập nhật
- Tối ưu hóa việc xử lý nhiều ảnh đồng thời với Promise.all và timeout
- Cải thiện xử lý lỗi và thông báo timeout
- Bổ sung thống kê về số trang đã truy cập và số bài viết tìm thấy

## [1.5.3] - 2024-03-26

### Thêm mới
- Thêm hỗ trợ kết nối proxy cho chức năng tìm kiếm ảnh Google
- Cập nhật hàm getImageSize để hỗ trợ kết nối thông qua proxy
- Tùy chọn URL proxy có thể tùy chỉnh (http và https)

### Cập nhật
- Cải thiện cách xử lý lỗi khi kết nối qua proxy không thành công
- Bổ sung thông tin sử dụng proxy trong kết quả trả về

## [1.5.2] - 2024-03-24

### Cố định
- Sửa lỗi "Cannot find module './nodeDescription'" khi n8n tải node
- Điều chỉnh cấu trúc thư mục dist để đảm bảo tất cả các module được tải đúng cách
- Đảm bảo tất cả các file phụ thuộc được sao chép vào vị trí chính xác

## [1.5.1] - 2024-03-24

### Cố định
- Sửa cấu trúc thư mục và cấu hình package.json để phù hợp với n8n
- Tái cấu trúc file để đảm bảo n8n có thể tải node đúng cách
- Cập nhật đường dẫn file trong package.json

## [1.5.0] - 2024-03-23

### Thêm mới
- Hoàn thiện tính năng tìm kiếm ảnh Google với bộ test đầy đủ
- Thêm kiểm tra đặc biệt cho dữ liệu ảnh base64

### Cố định
- Sửa lỗi trong hàm isBase64Image để nhận dạng chính xác chuỗi base64
- Cải thiện độ chính xác của bộ lọc hình ảnh
- Sửa lỗi trong test để tăng độ phủ kiểm thử

## [1.4.0] - 2024-03-22

### Thêm mới
- Thêm thao tác "Tìm Kiếm Ảnh Google" cho phép tìm kiếm ảnh theo từ khóa
- Thêm tính năng lọc ảnh theo kích thước cho kết quả tìm kiếm Google
- Thêm tùy chọn giới hạn số lượng ảnh tải về

## [1.3.5] - 2024-03-22

### Thêm mới
- Hỗ trợ xử lý và lọc ảnh base64
- Thêm thống kê số lượng ảnh đã bỏ qua trong kết quả

### Cố định
- Sửa lỗi khi lọc ảnh theo kích thước không hoạt động đúng
- Cải thiện logic lọc để loại bỏ icon, avatar và sticker có kích thước nhỏ

## [1.3.4] - 2024-03-22

### Thay đổi
- Cập nhật biểu tượng cho node n8n
- Tối ưu hóa hiệu suất cào dữ liệu

## [1.3.3] - 2024-03-22

### Thêm mới
- Thêm biểu tượng cho node n8n

### Cố định
- Cải thiện test suite cho thao tác randomArticle
- Sửa lỗi TypeScript trong crawlPage.test.ts
- Tối ưu hóa quy trình kiểm thử với mocks chính xác hơn

## [1.3.0] - 2024-03-21

### Thêm mới
- Thêm tính năng cập nhật trạng thái bài viết (pending/done/skipped)
- Thêm cột status trong schema cơ sở dữ liệu
- Thêm cột updated_at để theo dõi thời gian cập nhật

### Thay đổi
- Cải thiện schema cơ sở dữ liệu với các cột trạng thái và thời gian
- Cập nhật hàm lưu bài viết với trạng thái mặc định là "pending"

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