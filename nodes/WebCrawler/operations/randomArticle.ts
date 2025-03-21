import { INodeExecutionData } from 'n8n-workflow';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeUrl } from '../utils/imageUtils';

export async function getRandomArticle(
    url: string,
    articleSelector: string,
    titleSelector: string,
    linkSelector: string,
    contentSelector: string,
    fetchFullContent: boolean
): Promise<INodeExecutionData> {
    // Gửi yêu cầu HTTP
    const response = await axios.get(url);
    const html = response.data;

    // Load HTML vào Cheerio
    const $ = cheerio.load(html);

    // Tìm tất cả các bài viết
    const articles: Array<{ title: string; link: string; content?: string; images?: string[] }> = [];
    $(articleSelector).each((_, articleElement) => {
        // Trích xuất tiêu đề
        const title = $(articleElement).find(titleSelector).first().text().trim();
        
        // Trích xuất liên kết
        let link = $(articleElement).find(linkSelector).first().attr('href') || '';
        
        // Chuẩn hóa đường dẫn
        if (link) {
            link = normalizeUrl(link, url);
        }
        
        // Trích xuất nội dung tóm tắt nếu có
        let content = '';
        if ($(articleElement).find(contentSelector).length > 0) {
            content = $(articleElement).find(contentSelector).first().text().trim();
        }
        
        // Trích xuất hình ảnh trong bài viết
        const images: string[] = [];
        $(articleElement).find('img').each((_, img) => {
            const src = $(img).attr('src');
            if (src) {
                // Chuẩn hóa đường dẫn
                const fullSrc = normalizeUrl(src, url);
                images.push(fullSrc);
            }
        });
        
        if (title && link) {
            articles.push({ title, link, content, images });
        }
    });

    // Kiểm tra có bài viết không
    if (articles.length === 0) {
        throw new Error(`Không tìm thấy bài viết nào với selector: ${articleSelector}`);
    }

    // Chọn ngẫu nhiên 1 bài viết
    const randomIndex = Math.floor(Math.random() * articles.length);
    const selectedArticle = articles[randomIndex];

    // Lấy nội dung đầy đủ nếu cần
    if (fetchFullContent && selectedArticle.link) {
        try {
            const articleResponse = await axios.get(selectedArticle.link);
            const articleHtml = articleResponse.data;
            const $article = cheerio.load(articleHtml);
            
            // Cập nhật nội dung
            selectedArticle.content = $article(contentSelector).text().trim() || $article('body').text().trim();
            
            // Cập nhật hình ảnh
            $article('img').each((_, img) => {
                const src = $article(img).attr('src');
                if (src) {
                    // Chuẩn hóa đường dẫn
                    const fullSrc = normalizeUrl(src, selectedArticle.link || '');
                    
                    // Thêm vào danh sách nếu chưa có
                    if (!selectedArticle.images?.includes(fullSrc)) {
                        if (!selectedArticle.images) selectedArticle.images = [];
                        selectedArticle.images.push(fullSrc);
                    }
                }
            });
        } catch (error) {
            console.error(`Không thể lấy nội dung từ ${selectedArticle.link}:`, error);
        }
    }
    
    // Tạo ID ngẫu nhiên cho bài viết
    const articleId = `article_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Chuẩn bị dữ liệu đầu ra
    return {
        json: {
            operation: 'randomArticle',
            articleId,
            article: selectedArticle,
            message: `Đã lấy bài viết "${selectedArticle.title}" từ trang web`,
        },
    };
} 