import { INodeExecutionData } from 'n8n-workflow';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getImageSize, normalizeUrl } from '../utils/imageUtils';

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
        if (src) {
            // Kiểm tra kích thước từ thuộc tính HTML
            const width = parseInt($(element).attr('width') || '0', 10);
            const height = parseInt($(element).attr('height') || '0', 10);
            
            // Chuẩn hóa đường dẫn
            const fullSrc = normalizeUrl(src, url);
            
            allImages.push({ src: fullSrc, width, height });
        }
    });
    
    // Lọc hình ảnh theo kích thước
    let imageLinks: string[] = [];
    
    if (filterImagesBySize) {
        const filteredImages = [];
        
        for (const image of allImages) {
            // Nếu kích thước từ HTML đã đáp ứng yêu cầu, không cần kiểm tra thêm
            if (
                (image.width && image.width >= minImageSize) || 
                (image.height && image.height >= minImageSize)
            ) {
                filteredImages.push(image.src);
                continue;
            }
            
            // Nếu cần kiểm tra kích thước thực tế và chưa biết kích thước chính xác từ HTML
            if (checkActualImageSize && (!image.width || !image.height)) {
                try {
                    const dimensions = await getImageSize(image.src);
                    
                    if (
                        (dimensions.width && dimensions.width >= minImageSize) || 
                        (dimensions.height && dimensions.height >= minImageSize)
                    ) {
                        filteredImages.push(image.src);
                    }
                } catch (error) {
                    console.error(`Lỗi khi kiểm tra kích thước hình ảnh ${image.src}:`, error);
                }
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
                filteredCount: imageLinks.length
            } : {
                filtered: false
            }
        },
    };
} 