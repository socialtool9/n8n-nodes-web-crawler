import axios from 'axios';
import { URL } from 'url';
import * as sizeOf from 'image-size';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Kiểm tra xem URL có phải là URL hình ảnh hợp lệ hay không
 */
export function isValidImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const lowercaseUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowercaseUrl.endsWith(ext)) || 
         lowercaseUrl.includes('/image') || 
         lowercaseUrl.includes('/img') ||
         lowercaseUrl.startsWith('data:image/');
}

/**
 * Chuẩn hóa URL hình ảnh, xử lý cả tương đối và tuyệt đối
 */
export function normalizeImageUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('data:')) return imageUrl;
  
  try {
    const url = new URL(imageUrl, baseUrl);
    return url.href;
  } catch (e) {
    return imageUrl;
  }
}

/**
 * Kiểm tra xem chuỗi có phải là base64 hình ảnh không
 */
export function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/') && str.includes('base64,');
}

/**
 * Lấy kích thước của hình ảnh từ URL
 */
export async function getImageSize(
  url: string, 
  proxy?: string, 
  timeout: number = 15000
): Promise<{ width?: number; height?: number; timeout?: boolean }> {
  if (isBase64Image(url)) {
    try {
      const base64Data = url.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const dimensions = sizeOf.imageSize(buffer);
      return {
        width: dimensions.width,
        height: dimensions.height
      };
    } catch (error) {
      return { width: undefined, height: undefined };
    }
  }

  try {
    const config: any = {
      responseType: 'arraybuffer',
      timeout
    };
    
    if (proxy) {
      if (url.startsWith('https://')) {
        config.httpsAgent = new HttpsProxyAgent(proxy);
      } else {
        config.httpAgent = new HttpProxyAgent(proxy);
      }
    }
    
    const imageDataPromise = axios.get(url, config);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeout);
    });
    
    const response = await Promise.race([imageDataPromise, timeoutPromise]) as any;
    const buffer = response.data;
    const dimensions = sizeOf.imageSize(buffer);
    
    return {
      width: dimensions.width,
      height: dimensions.height
    };
  } catch (error) {
    if ((error as Error).message === 'Timeout') {
      return { width: undefined, height: undefined, timeout: true };
    }
    return { width: undefined, height: undefined };
  }
} 