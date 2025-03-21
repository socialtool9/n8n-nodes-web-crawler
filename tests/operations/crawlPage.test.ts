import { crawlPage } from '../../nodes/WebCrawler/operations/crawlPage';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as imageUtils from '../../nodes/WebCrawler/utils/imageUtils';
import { IDataObject } from 'n8n-workflow';

jest.mock('axios');
jest.mock('cheerio');
jest.mock('../../nodes/WebCrawler/utils/imageUtils');

describe('crawlPage operation', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockedImageUtils = imageUtils as jest.Mocked<typeof imageUtils>;
  const mockedCheerio = cheerio as jest.Mocked<typeof cheerio>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock mặc định
    mockedAxios.get.mockResolvedValue({
      data: '<html><body><p>Test content</p><img src="image1.jpg" width="800" height="600"/></body></html>'
    });
    
    // Mock hàm normalizeUrl
    mockedImageUtils.normalizeUrl.mockImplementation((src, baseUrl) => {
      if (src === 'image1.jpg') return 'https://example.com/image1.jpg';
      if (src === 'image2.jpg') return 'https://example.com/image2.jpg';
      return `https://example.com/${src}`;
    });
    
    // Mock hàm getImageSize
    mockedImageUtils.getImageSize.mockImplementation(async (url) => {
      if (url.includes('image1.jpg')) return { width: 800, height: 600 };
      return { width: 300, height: 200 };
    });
    
    // Mock hàm isBase64Image
    mockedImageUtils.isBase64Image.mockImplementation((src) => {
      return src.startsWith('data:image');
    });
    
    // Mock hàm getBase64Buffer
    mockedImageUtils.getBase64Buffer.mockImplementation((base64String) => {
      return Buffer.from('mockBase64Data');
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should extract text and images from a web page', async () => {
    // HTML mẫu để test
    const mockHtml = '<html><body><p>Sample text content</p><img src="image1.jpg" width="800" height="600"/><img src="image2.jpg" width="800" height="600"/></body></html>';
    
    // Mock axios get trả về HTML mẫu
    mockedAxios.get.mockResolvedValue({
      data: mockHtml
    });
    
    // Sử dụng cheerio thật thay vì mock
    jest.spyOn(cheerio, 'load').mockImplementation((html) => {
      // Sử dụng cheerio thật để parse HTML
      const realCheerio = jest.requireActual('cheerio').load(html);
      
      // Ghi đè phương thức để theo dõi các cuộc gọi
      const originalFind = realCheerio.prototype.find;
      realCheerio.prototype.find = function (selector) {
        console.log(`Cheerio find called with selector: ${selector}`);
        return originalFind.call(this, selector);
      };
      
      return realCheerio;
    });
    
    // Mock hàm normalizeUrl để kiểm soát đầu ra
    mockedImageUtils.normalizeUrl.mockImplementation((src, baseUrl) => {
      console.log(`normalizeUrl called with: ${src}, ${baseUrl}`);
      if (src === 'image1.jpg') return 'https://example.com/image1.jpg';
      if (src === 'image2.jpg') return 'https://example.com/image2.jpg';
      return `https://example.com/${src}`;
    });
    
    // Thực thi
    const result = await crawlPage(
      'https://example.com',
      'p',
      'img',
      false,
      0,
      false
    );
    
    // Debug
    console.log('Result:', JSON.stringify(result.json, null, 2));
    
    // Kiểm tra
    expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com');
    expect(result.json).toHaveProperty('url', 'https://example.com');
    expect(result.json).toHaveProperty('textContent', 'Sample text content');
    expect(result.json).toHaveProperty('imageLinks');
    
    const json = result.json as IDataObject;
    expect(Array.isArray(json.imageLinks)).toBe(true);
    expect((json.imageLinks as string[]).length).toBe(2);
  });
  
  test('should filter images by size', async () => {
    // HTML mẫu để test với kích thước ảnh khác nhau
    const mockHtml = '<html><body><p>Sample text content</p><img src="image1.jpg" width="800" height="600"/><img src="image2.jpg" width="300" height="200"/></body></html>';
    
    // Mock axios get trả về HTML mẫu
    mockedAxios.get.mockResolvedValue({
      data: mockHtml
    });
    
    // Sử dụng cheerio thật thay vì mock
    jest.spyOn(cheerio, 'load').mockImplementation((html) => {
      // Sử dụng cheerio thật để parse HTML
      const realCheerio = jest.requireActual('cheerio').load(html);
      return realCheerio;
    });
    
    // Mock hàm normalizeUrl để kiểm soát đầu ra
    mockedImageUtils.normalizeUrl.mockImplementation((src, baseUrl) => {
      console.log(`normalizeUrl called with: ${src}, ${baseUrl}`);
      if (src === 'image1.jpg') return 'https://example.com/image1.jpg';
      if (src === 'image2.jpg') return 'https://example.com/image2.jpg';
      return `https://example.com/${src}`;
    });
    
    // Thực thi - filter image > 500x500
    const result = await crawlPage(
      'https://example.com',
      'p',
      'img',
      true,
      500,
      false
    );
    
    // Debug
    console.log('Result:', JSON.stringify(result.json, null, 2));
    
    // Kiểm tra
    expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com');
    expect(result.json).toHaveProperty('url', 'https://example.com');
    expect(result.json).toHaveProperty('imageLinks');
    
    const json = result.json as IDataObject;
    expect(Array.isArray(json.imageLinks)).toBe(true);
    expect((json.imageLinks as string[]).length).toBe(1);
    expect((json.imageLinks as string[])[0]).toBe('https://example.com/image1.jpg');
    
    const filterDetails = json.filterDetails as IDataObject;
    expect(filterDetails.filtered).toBe(true);
  });
  
  test('should handle base64 images', async () => {
    // HTML mẫu với hình ảnh base64
    const mockHtml = '<html><body><p>Test content</p><img src="data:image/png;base64,iVBORw0K..." width="600" height="400"/><img src="data:image/png;base64,smallicon..." width="32" height="32"/></body></html>';
    
    // Mock axios get trả về HTML mẫu
    mockedAxios.get.mockResolvedValue({
      data: mockHtml
    });
    
    // Sử dụng cheerio thật
    jest.spyOn(cheerio, 'load').mockImplementation((html) => {
      return jest.requireActual('cheerio').load(html);
    });
    
    // Mock isBase64Image để nhận diện ảnh base64
    mockedImageUtils.isBase64Image.mockImplementation((src) => {
      return src.startsWith('data:image');
    });
    
    // Mock normalizeUrl để không thay đổi base64 data
    mockedImageUtils.normalizeUrl.mockImplementation((src, baseUrl) => {
      if (src.startsWith('data:image')) {
        return src; // Trả về nguyên dạng cho base64
      }
      return `https://example.com/${src}`;
    });
    
    // Mock getImageSize để trả về kích thước giả lập
    mockedImageUtils.getImageSize.mockImplementation(async (url) => {
      console.log(`getImageSize called with: ${url}`);
      if (url === 'data:image/png;base64,iVBORw0K...') return { width: 600, height: 400 };
      if (url === 'data:image/png;base64,smallicon...') return { width: 32, height: 32 };
      return { width: 300, height: 200 };
    });
    
    // Thực thi với bộ lọc kích thước
    const result = await crawlPage(
      'https://example.com',
      'p',
      'img',
      true,
      300,
      true
    );
    
    // Debug
    console.log('Result:', JSON.stringify(result.json, null, 2));
    
    // Kiểm tra
    expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com');
    
    const json = result.json as IDataObject;
    expect(Array.isArray(json.imageLinks)).toBe(true);
    
    // Chỉ có 1 ảnh base64 lớn hơn ngưỡng 300px
    expect((json.imageLinks as string[]).length).toBe(1);
    expect((json.imageLinks as string[])[0]).toBe('data:image/png;base64,iVBORw0K...');
    
    // Kiểm tra có thông tin skippedBase64Icons
    const filterDetails = json.filterDetails as IDataObject;
    expect(filterDetails.filtered).toBe(true);
    expect(filterDetails.skippedBase64Icons).toBe(1);
  });
  
  test('should crawl a real-world site like VnExpress', async () => {
    // HTML mẫu giả lập trang VnExpress
    const vnExpressHtml = `
      <html><body>
        <div class="description">Dòng Danube chảy qua các nước châu Âu</div>
        <div class="fck_detail"><p>Sông Danube là con sông lớn thứ hai châu Âu</p></div>
        <img class="lazy" src="image1.jpg" width="800" height="600" />
        <img class="lazyloaded" src="image2.jpg" width="300" height="200" />
      </body></html>
    `;
    
    // Mock axios response
    mockedAxios.get.mockResolvedValue({
      data: vnExpressHtml
    });
    
    // Sử dụng cheerio thật
    jest.spyOn(cheerio, 'load').mockImplementation((html) => {
      return jest.requireActual('cheerio').load(html);
    });
    
    // Mock normalizeUrl
    mockedImageUtils.normalizeUrl.mockImplementation((src, baseUrl) => {
      console.log(`normalizeUrl called with: ${src}, ${baseUrl}`);
      if (src === 'image1.jpg') return 'https://example.com/image1.jpg';
      if (src === 'image2.jpg') return 'https://example.com/image2.jpg';
      return `https://example.com/${src}`;
    });
    
    // Thực thi
    const result = await crawlPage(
      'https://vnexpress.net/du-lich/diem-den',
      '.description, .fck_detail',
      'img.lazy, img.lazyloaded',
      true,
      500,
      false
    );
    
    // Debug
    console.log('Result:', JSON.stringify(result.json, null, 2));
    
    // Kiểm tra
    expect(mockedAxios.get).toHaveBeenCalledWith('https://vnexpress.net/du-lich/diem-den');
    expect(result.json).toHaveProperty('url', 'https://vnexpress.net/du-lich/diem-den');
    expect(result.json).toHaveProperty('textContent');
    expect(result.json).toHaveProperty('imageLinks');
    
    const json = result.json as IDataObject;
    expect(Array.isArray(json.imageLinks)).toBe(true);
    expect((json.imageLinks as string[]).length).toBe(1);
    expect((json.imageLinks as string[])[0]).toBe('https://example.com/image1.jpg');
    
    const filterDetails = json.filterDetails as IDataObject;
    expect(filterDetails.filtered).toBe(true);
  });
}); 