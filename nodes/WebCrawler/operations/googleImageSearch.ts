import { INodeExecutionData } from 'n8n-workflow';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getImageSize } from '../utils/imageUtils';

export async function googleImageSearch(
    keyword: string,
    maxImages: number,
    minImageSize: number = 0,
    filterBySize: boolean = false
): Promise<INodeExecutionData> {
    // Chuẩn bị URL tìm kiếm Google, thêm tbm=isch để tìm kiếm ảnh
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=isch`;
    
    // Thiết lập User-Agent để tránh bị chặn
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
    };

    // Gửi yêu cầu HTTP
    const response = await axios.get(searchUrl, { headers });
    const html = response.data;

    // Load HTML vào Cheerio
    const $ = cheerio.load(html);
    
    // Mảng lưu URL ảnh đã tìm thấy
    const imageUrls: string[] = [];
    const skippedImages: { small: number, error: number } = { small: 0, error: 0 };
    
    // Trích xuất URL ảnh từ kết quả tìm kiếm
    // Google sử dụng các thẻ khác nhau và cấu trúc phức tạp, 
    // nên chúng ta tìm kiếm qua nhiều cách
    
    // Cách 1: Tìm các thẻ img có src hoặc data-src
    $('img').each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && !src.includes('data:image') && !imageUrls.includes(src)) {
            imageUrls.push(src);
        }
    });
    
    // Cách 2: Tìm trong các thuộc tính data- có chứa URL ảnh
    $('[data-src]').each((_, element) => {
        const src = $(element).attr('data-src');
        if (src && !imageUrls.includes(src)) {
            imageUrls.push(src);
        }
    });
    
    // Cách 3: Tìm kiếm trong các script JSON có chứa URL ảnh
    $('script').each((_, element) => {
        const scriptContent = $(element).html();
        if (scriptContent) {
            // Tìm các chuỗi URL ảnh trong script
            const matches = scriptContent.match(/(https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif|webp))/g);
            if (matches) {
                for (const match of matches) {
                    if (!imageUrls.includes(match)) {
                        imageUrls.push(match);
                    }
                }
            }
        }
    });
    
    // Lọc và xử lý các URL ảnh tìm được
    const processedImages: string[] = [];
    const processedImagesInfo: Array<{ url: string, width?: number, height?: number }> = [];
    
    // Giới hạn số lượng ảnh xử lý để tránh quá tải
    const imagesToProcess = imageUrls.slice(0, Math.min(maxImages * 3, 30));
    
    // Xử lý từng ảnh
    for (const imageUrl of imagesToProcess) {
        try {
            if (filterBySize && minImageSize > 0) {
                // Kiểm tra kích thước ảnh
                const dimensions = await getImageSize(imageUrl);
                
                if (
                    (dimensions.width && dimensions.width >= minImageSize) || 
                    (dimensions.height && dimensions.height >= minImageSize)
                ) {
                    processedImages.push(imageUrl);
                    processedImagesInfo.push({ 
                        url: imageUrl, 
                        width: dimensions.width, 
                        height: dimensions.height 
                    });
                    
                    // Nếu đủ số lượng, dừng xử lý
                    if (processedImages.length >= maxImages) {
                        break;
                    }
                } else {
                    skippedImages.small++;
                }
            } else {
                // Nếu không cần lọc theo kích thước, thêm trực tiếp
                processedImages.push(imageUrl);
                processedImagesInfo.push({ url: imageUrl });
                
                // Nếu đủ số lượng, dừng xử lý
                if (processedImages.length >= maxImages) {
                    break;
                }
            }
        } catch (error) {
            // Bỏ qua ảnh lỗi
            skippedImages.error++;
            console.error(`Lỗi khi xử lý ảnh ${imageUrl}:`, error);
        }
    }

    // Chuẩn bị dữ liệu đầu ra
    return {
        json: {
            operation: 'googleImageSearch',
            keyword,
            imageCount: processedImages.length,
            requestedCount: maxImages,
            imageUrls: processedImages,
            imagesInfo: processedImagesInfo,
            filterDetails: {
                filtered: filterBySize,
                minImageSize: filterBySize ? minImageSize : undefined,
                totalFound: imageUrls.length,
                processedCount: processedImages.length,
                skipped: skippedImages
            }
        },
    };
} 