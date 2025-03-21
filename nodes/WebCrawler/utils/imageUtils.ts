import axios from 'axios';
import sizeOf from 'image-size';
import { URL } from 'url';

// Kiểm tra xem một chuỗi có phải là ảnh base64 không
export function isBase64Image(src: string): boolean {
    return src.startsWith('data:image') && src.includes(';base64,');
}

// Lấy Buffer từ chuỗi base64
export function getBase64Buffer(base64String: string): Buffer {
    // Loại bỏ phần tiền tố data:image/png;base64, hoặc tương tự
    const base64Data = base64String.split(',')[1];
    return Buffer.from(base64Data, 'base64');
}

// Hàm kiểm tra kích thước thực tế của hình ảnh
export async function getImageSize(imageUrl: string): Promise<{ width?: number; height?: number }> {
    try {
        if (isBase64Image(imageUrl)) {
            // Xử lý ảnh base64
            const buffer = getBase64Buffer(imageUrl);
            const dimensions = sizeOf(buffer);
            return {
                width: dimensions.width,
                height: dimensions.height,
            };
        } else {
            // Xử lý ảnh thông thường qua URL
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            const dimensions = sizeOf(buffer);
            return {
                width: dimensions.width,
                height: dimensions.height,
            };
        }
    } catch (error) {
        console.error(`Lỗi khi lấy kích thước hình ảnh:`, error);
        return { width: undefined, height: undefined };
    }
}

// Hàm chuẩn hóa đường dẫn URL
export function normalizeUrl(src: string, baseUrl: string): string {
    // Nếu là ảnh base64, trả về nguyên dạng
    if (isBase64Image(src)) {
        return src;
    }
    
    if (src.startsWith('//')) {
        return `https:${src}`;
    } else if (src.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        return `${urlObj.origin}${src}`;
    } else if (!src.startsWith('http')) {
        const urlObj = new URL(baseUrl);
        return `${urlObj.origin}/${src}`;
    }
    return src;
} 