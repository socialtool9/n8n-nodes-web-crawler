import { INodeExecutionData } from 'n8n-workflow';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeUrl } from '../utils/imageUtils';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

export async function getRandomArticle(
    url: string,
    articleSelector: string,
    titleSelector: string,
    linkSelector: string,
    contentSelector: string,
    fetchFullContent: boolean,
    paginationSelector?: string,
    maxPages: number = 1,
    useProxies: boolean = false,
    proxyList: string = '',
    requestTimeout: number = 30000
): Promise<INodeExecutionData> {
    // Mảng lưu tất cả các bài viết
    const allArticles: Array<{ title: string; link: string; content?: string; images?: string[]; pageUrl?: string }> = [];
    
    // Phân tích danh sách proxy nếu được cung cấp
    let proxies: string[] = [];
    if (useProxies && proxyList) {
        proxies = proxyList.split(',').map(proxy => proxy.trim()).filter(proxy => proxy.length > 0);
    }
    
    // Hàm chọn proxy ngẫu nhiên từ danh sách
    const getRandomProxy = (): string | undefined => {
        if (proxies.length === 0) return undefined;
        const randomIndex = Math.floor(Math.random() * proxies.length);
        return proxies[randomIndex];
    };
    
    // Hàm tạo cấu hình axios với proxy ngẫu nhiên
    const createAxiosConfig = (currentProxy?: string) => {
        const config: any = {
            timeout: requestTimeout
        };
        
        if (useProxies && currentProxy) {
            if (currentProxy.startsWith('https://')) {
                config.httpsAgent = new HttpsProxyAgent(currentProxy);
            } else {
                config.httpAgent = new HttpProxyAgent(currentProxy);
            }
        }
        
        return config;
    };
    
    // Mảng các URL cần truy cập
    const pagesToVisit: string[] = [url];
    const visitedPages: Set<string> = new Set();
    
    // Lấy dữ liệu từ nhiều trang nếu cần
    for (let pageIndex = 0; pageIndex < Math.min(maxPages, pagesToVisit.length); pageIndex++) {
        const currentPageUrl = pagesToVisit[pageIndex];
        
        // Bỏ qua trang đã truy cập
        if (visitedPages.has(currentPageUrl)) continue;
        visitedPages.add(currentPageUrl);
        
        try {
            // Chọn proxy ngẫu nhiên cho request này
            const currentProxy = getRandomProxy();
            const axiosConfig = createAxiosConfig(currentProxy);
            
            // Gửi yêu cầu HTTP
            const response = await axios.get(currentPageUrl, axiosConfig);
            const html = response.data;
            
            // Load HTML vào Cheerio
            const $ = cheerio.load(html);
            
            // Tìm và thêm các liên kết phân trang nếu được chỉ định
            if (paginationSelector && pagesToVisit.length < maxPages) {
                $(paginationSelector).each((_, pageLink) => {
                    const href = $(pageLink).attr('href');
                    if (href) {
                        const normalizedPageUrl = normalizeUrl(href, currentPageUrl);
                        // Chỉ thêm URL mới và chưa truy cập
                        if (!visitedPages.has(normalizedPageUrl) && !pagesToVisit.includes(normalizedPageUrl)) {
                            pagesToVisit.push(normalizedPageUrl);
                        }
                    }
                });
            }
            
            // Tìm tất cả các bài viết trên trang hiện tại
            $(articleSelector).each((_, articleElement) => {
                // Trích xuất tiêu đề
                const title = $(articleElement).find(titleSelector).first().text().trim();
                
                // Trích xuất liên kết
                let link = $(articleElement).find(linkSelector).first().attr('href') || '';
                
                // Chuẩn hóa đường dẫn
                if (link) {
                    link = normalizeUrl(link, currentPageUrl);
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
                        const fullSrc = normalizeUrl(src, currentPageUrl);
                        images.push(fullSrc);
                    }
                });
                
                if (title && link) {
                    allArticles.push({ title, link, content, images, pageUrl: currentPageUrl });
                }
            });
        } catch (error) {
            console.error(`Lỗi khi truy cập trang ${currentPageUrl}:`, error);
            // Tiếp tục với trang tiếp theo
        }
    }

    // Kiểm tra có bài viết không
    if (allArticles.length === 0) {
        throw new Error(`Không tìm thấy bài viết nào với selector: ${articleSelector}`);
    }

    // Chọn ngẫu nhiên 1 bài viết
    const randomIndex = Math.floor(Math.random() * allArticles.length);
    const selectedArticle = allArticles[randomIndex];

    // Lấy nội dung đầy đủ nếu cần
    if (fetchFullContent && selectedArticle.link) {
        try {
            const currentProxy = getRandomProxy();
            const axiosConfig = createAxiosConfig(currentProxy);
            
            const articleResponse = await axios.get(selectedArticle.link, axiosConfig);
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
            stats: {
                pagesVisited: visitedPages.size,
                totalArticlesFound: allArticles.length,
                proxyUsed: useProxies && proxies.length > 0 ? 'yes' : 'no'
            }
        },
    };
} 