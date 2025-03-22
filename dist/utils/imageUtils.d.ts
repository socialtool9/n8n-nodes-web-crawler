/**
 * Kiểm tra xem URL có phải là URL hình ảnh hợp lệ hay không
 */
export declare function isValidImageUrl(url: string): boolean;
/**
 * Chuẩn hóa URL hình ảnh, xử lý cả tương đối và tuyệt đối
 */
export declare function normalizeImageUrl(imageUrl: string, baseUrl: string): string;
/**
 * Kiểm tra xem chuỗi có phải là base64 hình ảnh không
 */
export declare function isBase64Image(str: string): boolean;
/**
 * Lấy kích thước của hình ảnh từ URL
 */
export declare function getImageSize(url: string, proxy?: string, timeout?: number): Promise<{
    width?: number;
    height?: number;
    timeout?: boolean;
}>;
