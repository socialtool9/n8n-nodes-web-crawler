import axios from 'axios';
import sizeOf from 'image-size';
import { URL } from 'url';

// Hàm kiểm tra kích thước thực tế của hình ảnh
export async function getImageSize(imageUrl: string): Promise<{ width?: number; height?: number }> {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const dimensions = sizeOf(buffer);
        return {
            width: dimensions.width,
            height: dimensions.height,
        };
    } catch (error) {
        console.error(`Lỗi khi lấy kích thước hình ảnh ${imageUrl}:`, error);
        return { width: undefined, height: undefined };
    }
}

// Hàm chuẩn hóa đường dẫn URL
export function normalizeUrl(src: string, baseUrl: string): string {
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