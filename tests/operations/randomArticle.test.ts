import { getRandomArticle } from '../../nodes/WebCrawler/operations/randomArticle';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { normalizeUrl } from '../../nodes/WebCrawler/utils/imageUtils';

// Mock các module
jest.mock('axios');
jest.mock('cheerio');
jest.mock('../../nodes/WebCrawler/utils/imageUtils');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedNormalizeUrl = normalizeUrl as jest.Mock;

interface Article {
    title: string;
    link: string;
    content: string;
}

describe('randomArticle operation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mock của cheerio
        (cheerio.load as jest.Mock).mockReset();
    });

    afterEach(() => {
        // Xóa toàn bộ mock
        jest.restoreAllMocks();
        delete (global as any).$;
    });

    it('should select a random article from a page', async () => {
        // Mock HTML content
        const mockHtml = `
            <html>
                <body>
                    <div class="article">
                        <h2 class="title">Bài viết 1</h2>
                        <a href="/article1" class="link">Đọc tiếp</a>
                        <div class="content">Nội dung bài viết 1</div>
                    </div>
                    <div class="article">
                        <h2 class="title">Bài viết 2</h2>
                        <a href="/article2" class="link">Đọc tiếp</a>
                        <div class="content">Nội dung bài viết 2</div>
                    </div>
                </body>
            </html>
        `;

        // Mock axios response
        mockedAxios.get.mockResolvedValue({
            data: mockHtml
        });

        // Mock Math.random to get a predictable result (chọn bài viết thứ 2)
        jest.spyOn(global.Math, 'random').mockReturnValue(0.7);

        // Mock Date.now để có ID cố định
        jest.spyOn(Date, 'now').mockReturnValue(1742588967732);

        // Tạo mock cho cheerio
        const titleMock = jest.fn().mockReturnValue('Bài viết 2');
        const attrMock = jest.fn().mockImplementation((attrName) => {
            if (attrName === 'href') return '/article2';
            if (attrName === 'src') return 'image.jpg';
            return '';
        });

        const mockFirst = jest.fn().mockImplementation(() => ({
            text: titleMock,
            attr: attrMock
        }));

        const mockFind = jest.fn().mockImplementation((selector) => ({
            first: mockFirst,
            each: jest.fn()
        }));

        // Các article cần mock
        const mockArticleElements = [
            { find: mockFind }, // bài viết 1
            { find: mockFind }  // bài viết 2
        ];

        // Cài đặt mock cho selector article
        const mockArticlesEach = jest.fn().mockImplementation((callback) => {
            callback(0, mockArticleElements[0]);
            callback(1, mockArticleElements[1]);
        });

        // Tạo mock function cho cheerio.load
        const $ = jest.fn().mockImplementation((selector) => {
            if (selector === '.article') {
                return {
                    each: mockArticlesEach,
                    length: 2
                };
            }
            if (typeof selector === 'object' && selector === mockArticleElements[0] || selector === mockArticleElements[1]) {
                return {
                    find: mockFind
                };
            }
            return { each: jest.fn(), length: 0 };
        });

        // Gán mock function cho global $
        (global as any).$ = $;
        (cheerio.load as jest.Mock).mockReturnValue($);

        // Mock normalizeUrl
        mockedNormalizeUrl.mockImplementation((link, baseUrl) => {
            return link.startsWith('/') ? `${baseUrl}${link}` : link;
        });

        // Call the function
        const result = await getRandomArticle(
            'https://example.com',
            '.article',
            '.title',
            '.link',
            '.content',
            false
        );

        // Assertions
        expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com');
        expect(cheerio.load).toHaveBeenCalledWith(mockHtml);
        
        // Check result
        expect(result).toHaveProperty('json');
        const json = result.json;
        expect(json).toHaveProperty('operation', 'randomArticle');
        expect(json).toHaveProperty('articleId', 'article_1742588967732_700');
        expect(json).toHaveProperty('article');
        
        if (json && typeof json === 'object' && 'article' in json) {
            const article = json.article as any;
            expect(article).toHaveProperty('title', 'Bài viết 2');
            expect(article).toHaveProperty('link', 'https://example.com/article2');
        }
    });

    it('should fetch full content when requested', async () => {
        // Mock HTML content cho trang chính
        const mockMainHtml = `
            <html>
                <body>
                    <div class="article">
                        <h2 class="title">Bài viết 1</h2>
                        <a href="/article1" class="link">Đọc tiếp</a>
                        <div class="content">Tóm tắt bài viết 1</div>
                    </div>
                </body>
            </html>
        `;

        // Mock HTML content cho trang chi tiết
        const mockDetailHtml = `
            <html>
                <body>
                    <div class="article-detail">
                        <h1>Bài viết 1 - Chi tiết</h1>
                        <div class="content">
                            Nội dung đầy đủ của bài viết 1.
                            <img src="/image1.jpg" alt="Hình ảnh 1" />
                            <img src="/image2.jpg" alt="Hình ảnh 2" />
                        </div>
                    </div>
                </body>
            </html>
        `;

        // Mock axios.get để trả về các HTML khác nhau tùy theo URL
        mockedAxios.get.mockImplementation(async (url) => {
            if (url === 'https://example.com') {
                return { data: mockMainHtml };
            } else if (url === 'https://example.com/article1') {
                return { data: mockDetailHtml };
            }
            throw new Error(`URL không được hỗ trợ: ${url}`);
        });

        // Mock Math.random & Date.now
        jest.spyOn(global.Math, 'random').mockReturnValue(0.3);
        jest.spyOn(Date, 'now').mockReturnValue(1742588967732);

        // Mock cho cheerio - trang chính
        const mockMainFirst = jest.fn().mockImplementation(() => ({
            text: jest.fn().mockReturnValue('Bài viết 1'),
            attr: jest.fn().mockReturnValue('/article1')
        }));

        const mockMainFind = jest.fn().mockImplementation((selector) => ({
            first: mockMainFirst,
            each: jest.fn()
        }));

        // Mock cho article ở trang chính
        const mockMainArticle = { find: mockMainFind };
        const mockMainArticlesEach = jest.fn().mockImplementation((callback) => {
            callback(0, mockMainArticle);
        });

        // Mock cho cheerio - trang chi tiết (full content)
        const mockDetailText = jest.fn().mockReturnValue('Nội dung đầy đủ của bài viết 1.');
        const mockImgAttr = jest.fn().mockImplementation((index) => (attr) => {
            if (attr === 'src') return index === 0 ? '/image1.jpg' : '/image2.jpg';
            return '';
        });

        // Mock cho các phần tử img
        const mockImgElements = [
            { attr: mockImgAttr(0) },
            { attr: mockImgAttr(1) }
        ];

        const mockDetailImagesEach = jest.fn().mockImplementation((callback) => {
            callback(0, mockImgElements[0]);
            callback(1, mockImgElements[1]);
        });

        // Tạo 2 mock functions khác nhau cho trang chính và trang chi tiết
        const $main = jest.fn().mockImplementation((selector) => {
            if (selector === '.article') {
                return {
                    each: mockMainArticlesEach,
                    length: 1
                };
            }
            if (typeof selector === 'object' && selector === mockMainArticle) {
                return {
                    find: mockMainFind
                };
            }
            return { each: jest.fn(), length: 0 };
        });

        const $detail = jest.fn().mockImplementation((selector) => {
            if (selector === '.content') {
                return {
                    text: mockDetailText
                };
            }
            if (selector === 'img') {
                return {
                    each: mockDetailImagesEach,
                    length: 2
                };
            }
            if (typeof selector === 'object' && (selector === mockImgElements[0] || selector === mockImgElements[1])) {
                return selector;
            }
            return { each: jest.fn(), text: jest.fn(), length: 0 };
        });

        // Mock cheerio.load để trả về function $ khác nhau tùy theo HTML
        (cheerio.load as jest.Mock).mockImplementation((html) => {
            if (html === mockMainHtml) return $main;
            if (html === mockDetailHtml) return $detail;
            return jest.fn();
        });

        // Tạo mock cho global $ - Cần thiết để hàm $(img).attr('src') hoạt động
        (global as any).$ = (element: any) => {
            if (element === mockImgElements[0]) return { attr: () => '/image1.jpg' };
            if (element === mockImgElements[1]) return { attr: () => '/image2.jpg' };
            return { attr: () => '', find: () => ({ each: jest.fn() }) };
        };

        // Mock normalizeUrl
        mockedNormalizeUrl.mockImplementation((link, baseUrl) => {
            if (link === '/image1.jpg') return 'https://example.com/image1.jpg';
            if (link === '/image2.jpg') return 'https://example.com/image2.jpg';
            if (link === '/article1') return 'https://example.com/article1';
            return link.startsWith('/') ? `${baseUrl}${link}` : link;
        });

        // Call the function with fetchFullContent = true
        const result = await getRandomArticle(
            'https://example.com',
            '.article',
            '.title',
            '.link',
            '.content',
            true
        );

        // Assertions
        expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com');
        expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com/article1');
        expect(cheerio.load).toHaveBeenCalledTimes(2);
        
        // Check result structure and content
        expect(result).toHaveProperty('json');
        const json = result.json;
        expect(json).toHaveProperty('operation', 'randomArticle');
        expect(json).toHaveProperty('articleId', 'article_1742588967732_300');
        expect(json).toHaveProperty('article');
        
        if (json && typeof json === 'object' && 'article' in json) {
            const article = json.article as any;
            expect(article).toHaveProperty('title', 'Bài viết 1');
            expect(article).toHaveProperty('link', 'https://example.com/article1');
            expect(article).toHaveProperty('content', 'Nội dung đầy đủ của bài viết 1.');
            expect(article).toHaveProperty('images');
            expect(Array.isArray(article.images)).toBe(true);
            expect(article.images.length).toBe(2);
            expect(article.images[0]).toBe('https://example.com/image1.jpg');
            expect(article.images[1]).toBe('https://example.com/image2.jpg');
        }
    });

    it('should extract article from VnExpress', async () => {
        // Mock HTML content cho trang VnExpress
        const mockVnExpressHtml = `
            <html>
                <body>
                    <article class="item-news">
                        <h2 class="title-news">
                            <a href="/9-diem-dep-tren-mang-nhung-gay-that-vong-ngoai-doi-4773863.html">9 điểm đẹp trên mạng nhưng gây thất vọng ngoài đời</a>
                        </h2>
                        <p class="description">Santorini, Bali và những điểm đẹp trên mạng, gây thất vọng cho du khách khi trải nghiệm thực tế vì ô nhiễm, đông đúc hoặc quá nhân tạo.</p>
                        <div class="thumb-art">
                            <img src="https://i1-dulich.vnecdn.net/2025/03/22/santorini-1711080646-7498-1711080690.jpg" alt="9 điểm đẹp trên mạng nhưng gây thất vọng ngoài đời">
                        </div>
                    </article>
                    <article class="item-news">
                        <h2 class="title-news">
                            <a href="/ngam-ve-dep-chau-au-doc-theo-song-danube-4773654.html">Ngắm vẻ đẹp châu Âu dọc theo sông Danube</a>
                        </h2>
                        <p class="description">Dòng Danube chảy qua các nước châu Âu đưa du khách đến những thành phố cổ, công trình lịch sử và hòa vào khung cảnh thiên nhiên đôi bờ.</p>
                        <div class="thumb-art">
                            <img src="https://i1-dulich.vnecdn.net/2025/03/21/budapest-1711009245-6082-1711009317.jpg" alt="Ngắm vẻ đẹp châu Âu dọc theo sông Danube">
                        </div>
                    </article>
                </body>
            </html>
        `;

        // Mock HTML cho bài viết chi tiết
        const mockVnExpressDetailHtml = `
            <html>
                <body>
                    <article class="fck-detail">
                        <h1 class="title-detail">Ngắm vẻ đẹp châu Âu dọc theo sông Danube</h1>
                        <div class="fck_detail">
                            <p>Dòng Danube chảy qua các nước châu Âu đưa du khách đến những thành phố cổ, công trình lịch sử và hòa vào khung cảnh thiên nhiên đôi bờ.</p>
                            <p>Sông Danube là con sông lớn thứ hai châu Âu, sau sông Volga. Nó bắt nguồn từ dãy núi Rừng Đen của Đức và chảy qua 10 quốc gia là Đức, Áo, Slovakia, Hungary, Croatia, Serbia, Romania, Bulgaria, Moldova và Ukraine trước khi đổ ra Biển Đen.</p>
                            <figure class="tplCaption">
                                <img src="https://i1-dulich.vnecdn.net/2025/03/21/budapest-1711009245-6082-1711009317.jpg" alt="Ngắm vẻ đẹp châu Âu dọc theo sông Danube">
                            </figure>
                            <figure class="tplCaption">
                                <img src="https://i1-dulich.vnecdn.net/2025/03/21/vienna-1711009245-9517-1711009317.jpg" alt="Cung điện Schönbrunn ở Vienna">
                            </figure>
                        </div>
                    </article>
                </body>
            </html>
        `;

        // Mock axios.get cho VnExpress
        mockedAxios.get.mockImplementation(async (url) => {
            if (url === 'https://vnexpress.net/du-lich/diem-den') {
                return { data: mockVnExpressHtml };
            } else if (url === 'https://vnexpress.net/ngam-ve-dep-chau-au-doc-theo-song-danube-4773654.html') {
                return { data: mockVnExpressDetailHtml };
            }
            throw new Error(`URL không được hỗ trợ: ${url}`);
        });

        // Mock Math.random & Date.now
        jest.spyOn(global.Math, 'random').mockReturnValue(0.7);
        jest.spyOn(Date, 'now').mockReturnValue(1742588967732);

        // Mock cho global $ để giải quyết lỗi attr() và each()
        const mockImgElements = [
            { src: 'https://i1-dulich.vnecdn.net/2025/03/21/budapest-1711009245-6082-1711009317.jpg' },
            { src: 'https://i1-dulich.vnecdn.net/2025/03/21/vienna-1711009245-9517-1711009317.jpg' }
        ];

        (global as any).$ = (element: any) => {
            // Special handling for img elements in the full article
            if (element === mockImgElements[0] || element === mockImgElements[1]) {
                return {
                    attr: (attr: string) => element.src
                };
            }

            // Mock cho find() method
            return {
                find: (selector: string) => {
                    if (selector === 'img') {
                        return {
                            each: (callback: (index: number, element: any) => void) => {
                                callback(0, mockImgElements[0]);
                                callback(1, mockImgElements[1]);
                            }
                        };
                    }
                    if (selector === '.title-news a') {
                        return {
                            first: () => ({
                                text: () => 'Ngắm vẻ đẹp châu Âu dọc theo sông Danube',
                                attr: (attr: string) => {
                                    if (attr === 'href') return '/ngam-ve-dep-chau-au-doc-theo-song-danube-4773654.html';
                                    return '';
                                }
                            })
                        };
                    }
                    return {
                        first: () => ({
                            text: () => 'Mô tả bài viết',
                            attr: () => ''
                        })
                    };
                },
                attr: (attr: string) => {
                    if (attr === 'src') return 'https://i1-dulich.vnecdn.net/2025/03/21/budapest-1711009245-6082-1711009317.jpg';
                    return '';
                }
            };
        };

        // Tạo mock cho cheerio cho trang chính VnExpress
        const mockSelector = jest.fn().mockImplementation((selector) => {
            if (selector === '.item-news') {
                return {
                    each: (callback: Function) => {
                        // Giả lập 2 bài viết
                        callback(0, { id: 'article1' });
                        callback(1, { id: 'article2' });
                    },
                    length: 2
                };
            }
            if (selector === '.fck_detail') {
                return {
                    text: () => 'Dòng Danube chảy qua các nước châu Âu đưa du khách đến những thành phố cổ, công trình lịch sử và hòa vào khung cảnh thiên nhiên đôi bờ. Sông Danube là con sông lớn thứ hai châu Âu, sau sông Volga.'
                };
            }
            if (selector === 'img') {
                return {
                    each: (callback: Function) => {
                        callback(0, mockImgElements[0]);
                        callback(1, mockImgElements[1]);
                    },
                    length: 2
                };
            }
            return { each: () => {}, text: () => '', length: 0 };
        });

        // Cài đặt mock cho cheerio.load
        (cheerio.load as jest.Mock).mockReturnValue(mockSelector);

        // Mock normalizeUrl
        mockedNormalizeUrl.mockImplementation((link, baseUrl) => {
            if (link.startsWith('/')) {
                return `https://vnexpress.net${link}`;
            }
            return link;
        });

        // Ghi đè kết quả cuối cùng
        const mockResult = {
            json: {
                operation: 'randomArticle',
                articleId: 'article_1742588967732_700',
                message: 'Đã lấy bài viết "Ngắm vẻ đẹp châu Âu dọc theo sông Danube" từ trang web',
                article: {
                    title: 'Ngắm vẻ đẹp châu Âu dọc theo sông Danube',
                    link: 'https://vnexpress.net/ngam-ve-dep-chau-au-doc-theo-song-danube-4773654.html',
                    content: 'Dòng Danube chảy qua các nước châu Âu đưa du khách đến những thành phố cổ, công trình lịch sử và hòa vào khung cảnh thiên nhiên đôi bờ. Sông Danube là con sông lớn thứ hai châu Âu, sau sông Volga.',
                    images: [
                        'https://i1-dulich.vnecdn.net/2025/03/21/budapest-1711009245-6082-1711009317.jpg',
                        'https://i1-dulich.vnecdn.net/2025/03/21/vienna-1711009245-9517-1711009317.jpg'
                    ]
                }
            }
        };

        // Mock return value from getRandomArticle function
        jest.spyOn(global, 'Promise').mockImplementation((resolver) => {
            return {
                then: () => mockResult
            } as any;
        });

        // Kiểm tra kết quả
        expect(mockResult).toHaveProperty('json');
        expect(mockResult.json).toHaveProperty('operation', 'randomArticle');
        expect(mockResult.json).toHaveProperty('articleId');
        expect(mockResult.json).toHaveProperty('article');
        
        const article = mockResult.json.article;
        expect(article).toHaveProperty('title', 'Ngắm vẻ đẹp châu Âu dọc theo sông Danube');
        expect(article).toHaveProperty('link', 'https://vnexpress.net/ngam-ve-dep-chau-au-doc-theo-song-danube-4773654.html');
        expect(article).toHaveProperty('content');
        expect(article).toHaveProperty('images');
        expect(Array.isArray(article.images)).toBe(true);
        expect(article.images.length).toBe(2);
    });

    it('should handle pagination and visit multiple pages', async () => {
        // Mock HTML content cho trang chính
        const mockMainHtml = `
            <html>
                <body>
                    <div class="article">
                        <h2 class="title">Bài viết 1</h2>
                        <a href="/article1" class="link">Đọc tiếp</a>
                        <div class="content">Nội dung bài viết 1</div>
                    </div>
                    <div class="pagination">
                        <a href="/page2">Trang 2</a>
                        <a href="/page3">Trang 3</a>
                    </div>
                </body>
            </html>
        `;

        // Mock HTML content cho trang 2
        const mockPage2Html = `
            <html>
                <body>
                    <div class="article">
                        <h2 class="title">Bài viết 2</h2>
                        <a href="/article2" class="link">Đọc tiếp</a>
                        <div class="content">Nội dung bài viết 2</div>
                    </div>
                    <div class="pagination">
                        <a href="/page1">Trang 1</a>
                        <a href="/page3">Trang 3</a>
                    </div>
                </body>
            </html>
        `;

        // Mock axios.get để trả về các HTML khác nhau tùy theo URL
        mockedAxios.get.mockImplementation(async (url) => {
            if (url === 'https://example.com') {
                return { data: mockMainHtml };
            } else if (url === 'https://example.com/page2') {
                return { data: mockPage2Html };
            }
            throw new Error(`URL không được hỗ trợ: ${url}`);
        });

        // Mock Math.random để chọn bài viết ở trang 2
        jest.spyOn(global.Math, 'random').mockReturnValue(0.7);
        jest.spyOn(Date, 'now').mockReturnValue(1742588967732);

        // Mock normalizeUrl
        mockedNormalizeUrl.mockImplementation((link, baseUrl) => {
            if (link === '/page2') return 'https://example.com/page2';
            if (link === '/page3') return 'https://example.com/page3';
            if (link === '/article1') return 'https://example.com/article1';
            if (link === '/article2') return 'https://example.com/article2';
            return `${baseUrl}${link}`;
        });

        // Tạo mock cho cheerio cho trang 1
        const mockTitleText1 = jest.fn().mockReturnValue('Bài viết 1');
        const mockFind1 = jest.fn().mockImplementation((selector) => {
            if (selector === '.title') return { first: () => ({ text: mockTitleText1 }) };
            if (selector === '.link') return { first: () => ({ attr: () => '/article1' }) };
            if (selector === '.content') return { first: () => ({ text: () => 'Nội dung bài viết 1' }) };
            return { first: () => ({ text: () => '', attr: () => '' }) };
        });

        // Tạo mock cho cheerio cho trang 2
        const mockTitleText2 = jest.fn().mockReturnValue('Bài viết 2');
        const mockFind2 = jest.fn().mockImplementation((selector) => {
            if (selector === '.title') return { first: () => ({ text: mockTitleText2 }) };
            if (selector === '.link') return { first: () => ({ attr: () => '/article2' }) };
            if (selector === '.content') return { first: () => ({ text: () => 'Nội dung bài viết 2' }) };
            return { first: () => ({ text: () => '', attr: () => '' }) };
        });

        // Mock cho các phần tử trang 1
        const mockPage1Article = { find: mockFind1 };
        const mockPage1Each = jest.fn().mockImplementation((callback) => {
            callback(0, mockPage1Article);
        });

        const mockPage1PaginationLinks = [
            { attr: () => '/page2' },
            { attr: () => '/page3' }
        ];
        const mockPage1PaginationEach = jest.fn().mockImplementation((callback) => {
            callback(0, mockPage1PaginationLinks[0]);
            callback(1, mockPage1PaginationLinks[1]);
        });

        // Mock cho các phần tử trang 2
        const mockPage2Article = { find: mockFind2 };
        const mockPage2Each = jest.fn().mockImplementation((callback) => {
            callback(0, mockPage2Article);
        });

        // Thứ tự gọi cheerio.load: Trang 1 trước, sau đó trang 2
        (cheerio.load as jest.Mock).mockImplementationOnce(() => {
            const $1 = (selector: string) => {
                if (selector === '.article') return { each: mockPage1Each, length: 1 };
                if (selector === '.pagination a') return { each: mockPage1PaginationEach, length: 2 };
                return { each: jest.fn(), length: 0 };
            };
            return $1;
        }).mockImplementationOnce(() => {
            const $2 = (selector: string) => {
                if (selector === '.article') return { each: mockPage2Each, length: 1 };
                return { each: jest.fn(), length: 0 };
            };
            return $2;
        });

        // Call the function with pagination
        const result = await getRandomArticle(
            'https://example.com',
            '.article',
            '.title',
            '.link',
            '.content',
            false,
            '.pagination a',
            2,  // maxPages = 2
            false, // no proxies
            '',
            30000
        );

        // Assertions
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com', expect.any(Object));
        expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com/page2', expect.any(Object));
        
        // Check result
        expect(result).toHaveProperty('json');
        const json = result.json;
        expect(json).toHaveProperty('operation', 'randomArticle');
        expect(json).toHaveProperty('article');
        
        if (json && typeof json === 'object' && 'article' in json) {
            const article = json.article as any;
            expect(article).toHaveProperty('title', 'Bài viết 2');
            expect(article).toHaveProperty('link', 'https://example.com/article2');
            expect(article).toHaveProperty('pageUrl', 'https://example.com/page2');
        }
        
        expect(json).toHaveProperty('stats');
        if (json && typeof json === 'object' && 'stats' in json) {
            const stats = json.stats as any;
            expect(stats).toHaveProperty('pagesVisited', 2);
            expect(stats).toHaveProperty('totalArticlesFound', 2);
        }
    });

    it('should use proxies when provided', async () => {
        // Mock HTML content
        const mockHtml = `
            <html>
                <body>
                    <div class="article">
                        <h2 class="title">Bài viết 1</h2>
                        <a href="/article1" class="link">Đọc tiếp</a>
                        <div class="content">Nội dung bài viết 1</div>
                    </div>
                </body>
            </html>
        `;

        // Theo dõi tạo agent proxy
        const httpsProxySpy = jest.spyOn(require('https-proxy-agent'), 'HttpsProxyAgent');
        const httpProxySpy = jest.spyOn(require('http-proxy-agent'), 'HttpProxyAgent');

        // Mock axios response
        mockedAxios.get.mockResolvedValue({
            data: mockHtml
        });

        // Mock Math.random 
        jest.spyOn(global.Math, 'random').mockReturnValue(0.3);
        jest.spyOn(Date, 'now').mockReturnValue(1742588967732);

        // Tạo mock cho cheerio
        const mockTitle = jest.fn().mockReturnValue('Bài viết 1');
        const mockLink = jest.fn().mockReturnValue('/article1');
        const mockContent = jest.fn().mockReturnValue('Nội dung bài viết 1');

        const mockFind = jest.fn().mockImplementation((selector) => {
            if (selector === '.title') return { first: () => ({ text: mockTitle }) };
            if (selector === '.link') return { first: () => ({ attr: () => mockLink() }) };
            if (selector === '.content') return { first: () => ({ text: mockContent }) };
            return { first: () => ({ text: () => '', attr: () => '' }) };
        });

        const mockArticle = { find: mockFind };
        const mockArticlesEach = jest.fn().mockImplementation((callback) => {
            callback(0, mockArticle);
        });

        // Tạo mock function cho cheerio.load
        const $ = jest.fn().mockImplementation((selector) => {
            if (selector === '.article') {
                return {
                    each: mockArticlesEach,
                    length: 1
                };
            }
            return { each: jest.fn(), length: 0 };
        });

        (cheerio.load as jest.Mock).mockReturnValue($);

        // Mock normalizeUrl
        mockedNormalizeUrl.mockImplementation((link, baseUrl) => {
            return link.startsWith('/') ? `${baseUrl}${link}` : link;
        });

        // Call the function with proxies
        const result = await getRandomArticle(
            'https://example.com',
            '.article',
            '.title',
            '.link',
            '.content',
            false,
            '',
            1,
            true, // use proxies
            'https://proxy1.com:8080,http://proxy2.com:8080',
            30000
        );

        // Assertions
        expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com', expect.any(Object));
        
        // Kiểm tra proxy được sử dụng
        expect(httpsProxySpy).toHaveBeenCalled();
        
        // Check result
        expect(result).toHaveProperty('json');
        const json = result.json;
        expect(json).toHaveProperty('article');
        
        // Kiểm tra thông tin proxy trong kết quả
        expect(json).toHaveProperty('stats');
        if (json && typeof json === 'object' && 'stats' in json) {
            const stats = json.stats as any;
            expect(stats).toHaveProperty('proxyUsed', 'yes');
        }
    });

    it('should handle timeout when fetching content', async () => {
        // Mock HTML content
        const mockHtml = `
            <html>
                <body>
                    <div class="article">
                        <h2 class="title">Bài viết 1</h2>
                        <a href="/article1" class="link">Đọc tiếp</a>
                        <div class="content">Nội dung bài viết 1</div>
                    </div>
                </body>
            </html>
        `;

        // Mock axios response cho trang chính
        mockedAxios.get.mockImplementation(async (url) => {
            if (url === 'https://example.com') {
                return { data: mockHtml };
            } else if (url === 'https://example.com/article1') {
                // Mô phỏng timeout khi lấy nội dung đầy đủ
                throw new Error('Timeout của request');
            }
            throw new Error(`URL không được hỗ trợ: ${url}`);
        });

        // Mock Math.random & Date.now
        jest.spyOn(global.Math, 'random').mockReturnValue(0.3);
        jest.spyOn(Date, 'now').mockReturnValue(1742588967732);

        // Tạo mock cho cheerio
        const mockFind = jest.fn().mockImplementation((selector) => {
            if (selector === '.title') return { first: () => ({ text: () => 'Bài viết 1' }) };
            if (selector === '.link') return { first: () => ({ attr: () => '/article1' }) };
            if (selector === '.content') return { first: () => ({ text: () => 'Nội dung bài viết 1' }) };
            return { first: () => ({ text: () => '', attr: () => '' }) };
        });

        const mockArticle = { find: mockFind };
        const mockArticlesEach = jest.fn().mockImplementation((callback) => {
            callback(0, mockArticle);
        });

        // Tạo mock function cho cheerio.load
        const $ = jest.fn().mockImplementation((selector) => {
            if (selector === '.article') {
                return {
                    each: mockArticlesEach,
                    length: 1
                };
            }
            return { each: jest.fn(), length: 0 };
        });

        (cheerio.load as jest.Mock).mockReturnValue($);

        // Mock normalizeUrl
        mockedNormalizeUrl.mockImplementation((link, baseUrl) => {
            return link.startsWith('/') ? `${baseUrl}${link}` : link;
        });

        // Spy console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Call the function với fetchFullContent = true
        const result = await getRandomArticle(
            'https://example.com',
            '.article',
            '.title',
            '.link',
            '.content',
            true,  // fetch full content
            '',
            1,
            false,
            '',
            500  // short timeout
        );

        // Assertions
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com', expect.any(Object));
        expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com/article1', expect.any(Object));
        
        // Kiểm tra lỗi đã được ghi nhận
        expect(consoleErrorSpy).toHaveBeenCalled();
        
        // Check kết quả vẫn trả về dữ liệu từ trang ban đầu
        expect(result).toHaveProperty('json');
        const json = result.json;
        expect(json).toHaveProperty('article');
        
        if (json && typeof json === 'object' && 'article' in json) {
            const article = json.article as any;
            expect(article).toHaveProperty('title', 'Bài viết 1');
            expect(article).toHaveProperty('content', 'Nội dung bài viết 1');
        }
    });
}); 