import { INodeExecutionData } from 'n8n-workflow';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getImageSize, isValidImageUrl, normalizeImageUrl } from '../utils/imageUtils';

export async function execute(
    url: string,
    textSelector: string,
    imageSelector: string,
    filterBySize: boolean = false,
    minImageSize: number = 0,
    checkActualSize: boolean = true
): Promise<INodeExecutionData> {
    try {
        // Gửi yêu cầu HTTP
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Trích xuất nội dung văn bản
        const textContent = $(textSelector).text().trim();

        // Trích xuất các liên kết hình ảnh
        const allImageElements = $(imageSelector);
        const allImageLinks: string[] = [];
        
        // Thống kê về hình ảnh đã lọc
        const stats = {
            filtered: filterBySize,
            minImageSize: filterBySize ? minImageSize : undefined,
            originalCount: allImageElements.length,
            filteredCount: 0,
            skippedForSize: 0,
            skippedBase64Icons: 0
        };

        for (let i = 0; i < allImageElements.length; i++) {
            const img = allImageElements[i];
            const srcAttribute = $(img).attr('src');
            
            if (srcAttribute) {
                const imageUrl = normalizeImageUrl(srcAttribute, url);
                
                if (imageUrl.startsWith('data:image')) {
                    if (!filterBySize) {
                        allImageLinks.push(imageUrl);
                        stats.filteredCount++;
                    } else {
                        stats.skippedBase64Icons++;
                    }
                    continue;
                }
                
                if (isValidImageUrl(imageUrl)) {
                    if (filterBySize && minImageSize > 0) {
                        if (checkActualSize) {
                            // Kiểm tra kích thước thực tế
                            const size = await getImageSize(imageUrl);
                            if ((size.width && size.width >= minImageSize) || 
                                (size.height && size.height >= minImageSize)) {
                                allImageLinks.push(imageUrl);
                                stats.filteredCount++;
                            } else {
                                stats.skippedForSize++;
                            }
                        } else {
                            allImageLinks.push(imageUrl);
                            stats.filteredCount++;
                        }
                    } else {
                        allImageLinks.push(imageUrl);
                        stats.filteredCount++;
                    }
                }
            }
        }

        return {
            json: {
                url,
                textContent,
                imageLinks: allImageLinks,
                imageCount: allImageLinks.length,
                filterDetails: stats
            },
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                json: {
                    url,
                    error: error.message,
                    success: false
                },
            };
        }
        
        return {
            json: {
                url,
                error: 'Lỗi không xác định',
                success: false
            },
        };
    }
} 