import { INodeExecutionData } from 'n8n-workflow';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getImageSize, normalizeUrl, isBase64Image } from '../utils/imageUtils';

export async function crawlPage(
    url: string,
    textSelector: string,
    imageSelector: string,
    filterImagesBySize: boolean,
    minImageSize: number,
    checkActualImageSize: boolean
): Promise<INodeExecutionData> {
    // Gửi yêu cầu HTTP
    const response = await axios.get(url);
    const html = response.data;

    // Load HTML vào Cheerio
    const $ = cheerio.load(html);

    // Trích xuất nội dung văn bản
    const textContent = $(textSelector).text().trim();

    // Trích xuất tất cả các liên kết hình ảnh
    const allImages: Array<{ src: string; width?: number; height?: number }> = [];
    $(imageSelector).each((_, element) => {
        const src = $(element).attr('src');
        if (!src) return; // Bỏ qua nếu không có src
        
        // Kiểm tra kích thước từ thuộc tính HTML
        const width = parseInt($(element).attr('width') || '0', 10);
        const height = parseInt($(element).attr('height') || '0', 10);
        
        // Chuẩn hóa đường dẫn (Base64 sẽ được giữ nguyên)
        const fullSrc = normalizeUrl(src, url);
        
        allImages.push({ src: fullSrc, width, height });
    });
    
    console.log(`Tìm thấy ${allImages.length} hình ảnh trên trang`);
    
    // Lọc hình ảnh theo kích thước
    let imageLinks: string[] = [];
    let skippedForSize = 0;
    let skippedBase64Icons = 0;
    
    if (filterImagesBySize) {
        const filteredImages = [];
        
        for (const image of allImages) {
            // Kiểm tra nếu là ảnh base64
            if (isBase64Image(image.src)) {
                // Với base64, nếu đã biết kích thước từ HTML và quá nhỏ -> bỏ qua luôn
                if ((image.width && image.width < minImageSize && image.height && image.height < minImageSize)) {
                    skippedBase64Icons++;
                    continue;
                }
                
                // Nếu không biết kích thước và cần kiểm tra
                if (checkActualImageSize && (!image.width || !image.height)) {
                    try {
                        const dimensions = await getImageSize(image.src);
                        if (dimensions.width && dimensions.height &&
                            dimensions.width >= minImageSize || dimensions.height >= minImageSize) {
                            filteredImages.push(image.src);
                        } else {
                            skippedBase64Icons++;
                        }
                    } catch (error) {
                        console.error(`Lỗi khi kiểm tra kích thước ảnh base64:`, error);
                    }
                } else {
                    // Nếu không kiểm tra kích thước thực tế, thêm vào lọc
                    filteredImages.push(image.src);
                }
                continue;
            }
            
            // Xử lý ảnh thông thường (không phải base64)
            // Nếu kích thước từ HTML đã đáp ứng yêu cầu
            if ((image.width && image.width >= minImageSize) || (image.height && image.height >= minImageSize)) {
                filteredImages.push(image.src);
                continue;
            }
            
            // Nếu cần kiểm tra kích thước thực tế và chưa biết kích thước chính xác từ HTML
            if (checkActualImageSize && (!image.width || !image.height)) {
                try {
                    const dimensions = await getImageSize(image.src);
                    
                    if ((dimensions.width && dimensions.width >= minImageSize) || 
                        (dimensions.height && dimensions.height >= minImageSize)) {
                        filteredImages.push(image.src);
                    } else {
                        skippedForSize++;
                    }
                } catch (error) {
                    console.error(`Lỗi khi kiểm tra kích thước ảnh: ${image.src}`, error);
                }
            } else {
                skippedForSize++;
            }
        }
        
        imageLinks = filteredImages;
    } else {
        // Nếu không lọc theo kích thước, lấy tất cả đường dẫn hình ảnh
        imageLinks = allImages.map(img => img.src);
    }

    // Chuẩn bị dữ liệu đầu ra
    return {
        json: {
            url,
            textContent,
            imageLinks,
            imageCount: imageLinks.length,
            filterDetails: filterImagesBySize ? {
                filtered: true,
                minImageSize,
                originalCount: allImages.length,
                filteredCount: imageLinks.length,
                skippedForSize,
                skippedBase64Icons
            } : {
                filtered: false
            }
        },
    };
} 