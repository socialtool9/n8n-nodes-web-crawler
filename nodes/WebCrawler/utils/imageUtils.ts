import axios from 'axios';
import sizeOf from 'image-size';
import { URL } from 'url';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

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
export async function getImageSize(
    imageUrl: string, 
    proxyUrl?: string, 
    timeout: number = 30000
): Promise<{ width?: number; height?: number; timeout?: boolean }> {
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
            const axiosConfig: any = { 
                responseType: 'arraybuffer',
                timeout: timeout
            };
            
            // Thêm cấu hình proxy nếu được cung cấp
            if (proxyUrl) {
                if (proxyUrl.startsWith('https://')) {
                    axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
                } else {
                    axiosConfig.httpAgent = new HttpProxyAgent(proxyUrl);
                }
            }
            
            const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
                setTimeout(() => resolve({ timeout: true }), timeout);
            });
            
            const fetchPromise = axios.get(imageUrl, axiosConfig)
                .then(response => {
                    const buffer = Buffer.from(response.data, 'binary');
                    const dimensions = sizeOf(buffer);
                    return {
                        width: dimensions.width,
                        height: dimensions.height,
                    };
                });
                
            // Sử dụng Promise.race để áp dụng timeout
            const result = await Promise.race([fetchPromise, timeoutPromise]);
            
            if ('timeout' in result) {
                return { timeout: true };
            }
            
            return result;
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