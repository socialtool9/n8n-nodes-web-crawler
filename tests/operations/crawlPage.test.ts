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
    // Chuẩn bị mock cheerio
    const mockEachImages = jest.fn().mockImplementation(function(callback) {
      callback(0, { type: 'tag', name: 'img' });
      callback(1, { type: 'tag', name: 'img' });
      return { length: 2 };
    });
    
    const mockAttr = jest.fn().mockImplementation(function(attr) {
      if (attr === 'src') {
        if (this.element && this.element.name === 'img') {
          return this.index === 0 ? 'image1.jpg' : 'image2.jpg';
        }
      }
      if (attr === 'width') return '800';
      if (attr === 'height') return '600';
      return undefined;
    });
    
    const mockText = jest.fn().mockReturnValue('Sample text content');
    
    // Chuẩn bị mock $ function
    const mockCheerioApi = (selector: string) => {
      const mock: any = {
        element: { type: 'selector', selector },
        index: 0,
        text: mockText,
        attr: mockAttr,
        find: jest.fn().mockReturnThis(),
        each: mockEachImages,
      };
      return mock;
    };
    
    // Đặt giá trị cho cheerio.load
    mockedCheerio.load.mockReturnValue(mockCheerioApi as any);
    
    // Thực thi
    const result = await crawlPage(
      'https://example.com',
      'p',
      'img',
      false,
      0,
      false
    );
    
    // Kiểm tra
    expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com');
    expect(mockedCheerio.load).toHaveBeenCalled();
    expect(result.json).toHaveProperty('url', 'https://example.com');
    expect(result.json).toHaveProperty('textContent', 'Sample text content');
    expect(result.json).toHaveProperty('imageLinks');
    
    const json = result.json as IDataObject;
    expect(Array.isArray(json.imageLinks)).toBe(true);
    expect((json.imageLinks as string[]).length).toBe(2);
  });
  
  test('should filter images by size', async () => {
    // Chuẩn bị mock cheerio
    const mockEachImages = jest.fn().mockImplementation(function(callback) {
      callback(0, { type: 'tag', name: 'img' });
      callback(1, { type: 'tag', name: 'img' });
      return { length: 2 };
    });
    
    const mockAttr = jest.fn().mockImplementation(function(attr) {
      if (attr === 'src') {
        if (this.element && this.element.name === 'img') {
          return this.index === 0 ? 'image1.jpg' : 'image2.jpg';
        }
      }
      if (attr === 'width') return this.index === 0 ? '800' : '300';
      if (attr === 'height') return this.index === 0 ? '600' : '200';
      return undefined;
    });
    
    const mockText = jest.fn().mockReturnValue('Sample text content');
    
    // Chuẩn bị mock $ function
    const mockCheerioApi = (selector: string) => {
      const mock: any = {
        element: { type: 'selector', selector },
        index: 0,
        text: mockText,
        attr: mockAttr,
        find: jest.fn().mockReturnThis(),
        each: mockEachImages,
      };
      return mock;
    };
    
    // Đặt giá trị cho cheerio.load
    mockedCheerio.load.mockReturnValue(mockCheerioApi as any);
    
    // Thực thi - filter image > 500x500
    const result = await crawlPage(
      'https://example.com',
      'p',
      'img',
      true,
      500,
      false
    );
    
    // Kiểm tra
    expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com');
    expect(mockedCheerio.load).toHaveBeenCalled();
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
    // Mock HTML with base64 images
    mockedAxios.get.mockResolvedValue({
      data: '<html><body><p>Test content</p><img src="data:image/png;base64,iVBORw0K..." width="600" height="400"/><img src="data:image/png;base64,smallicon..." width="32" height="32"/></body></html>'
    });
    
    // Chuẩn bị mock cheerio
    const mockEachImages = jest.fn().mockImplementation(function(callback) {
      callback(0, { type: 'tag', name: 'img' });
      callback(1, { type: 'tag', name: 'img' });
      return { length: 2 };
    });
    
    const mockAttr = jest.fn().mockImplementation(function(attr) {
      if (attr === 'src') {
        if (this.element && this.element.name === 'img') {
          return this.index === 0 
            ? 'data:image/png;base64,iVBORw0K...' 
            : 'data:image/png;base64,smallicon...';
        }
      }
      if (attr === 'width') return this.index === 0 ? '600' : '32';
      if (attr === 'height') return this.index === 0 ? '400' : '32';
      return undefined;
    });
    
    const mockText = jest.fn().mockReturnValue('Sample text content');
    
    // Chuẩn bị mock $ function
    const mockCheerioApi = (selector: string) => {
      const mock: any = {
        element: { type: 'selector', selector },
        index: 0,
        text: mockText,
        attr: mockAttr,
        find: jest.fn().mockReturnThis(),
        each: mockEachImages,
      };
      return mock;
    };
    
    // Đặt giá trị cho cheerio.load
    mockedCheerio.load.mockReturnValue(mockCheerioApi as any);
    
    // Mocks cho các phương thức xử lý base64
    mockedImageUtils.getImageSize.mockImplementation(async (url) => {
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
    
    // Kiểm tra
    expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com');
    expect(mockedCheerio.load).toHaveBeenCalled();
    
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
    // Chuẩn bị mock HTML VnExpress
    const vnExpressHtml = `
      <html><body>
        <div class="description">Dòng Danube chảy qua các nước châu Âu</div>
        <div class="fck_detail"><p>Sông Danube là con sông lớn thứ hai châu Âu</p></div>
        <img class="lazy" src="image1.jpg" width="800" height="600" />
        <img class="lazyloaded" src="image2.jpg" width="300" height="200" />
      </body></html>
    `;
    
    // Chuẩn bị mock cho test
    mockedAxios.get.mockResolvedValueOnce({
      data: vnExpressHtml
    });
    
    // Chuẩn bị mock cheerio
    const mockEachImages = jest.fn().mockImplementation(function(callback) {
      callback(0, { type: 'tag', name: 'img' });
      callback(1, { type: 'tag', name: 'img' });
      return { length: 2 };
    });
    
    const mockAttr = jest.fn().mockImplementation(function(attr) {
      if (attr === 'src') {
        if (this.element && this.element.name === 'img') {
          return this.index === 0 ? 'image1.jpg' : 'image2.jpg';
        }
      }
      if (attr === 'width') return this.index === 0 ? '800' : '300';
      if (attr === 'height') return this.index === 0 ? '600' : '200';
      return undefined;
    });
    
    const mockText = jest.fn().mockReturnValue('Dòng Danube chảy qua các nước châu Âu. Sông Danube là con sông lớn thứ hai châu Âu');
    
    // Chuẩn bị mock $ function
    const mockCheerioApi = (selector: string) => {
      const mock: any = {
        element: { type: 'selector', selector },
        index: 0,
        text: mockText,
        attr: mockAttr,
        find: jest.fn().mockReturnThis(),
        each: mockEachImages,
      };
      return mock;
    };
    
    // Đặt giá trị cho cheerio.load
    mockedCheerio.load.mockReturnValue(mockCheerioApi as any);
    
    // Thực thi
    const result = await crawlPage(
      'https://vnexpress.net/du-lich/diem-den',
      '.description, .fck_detail',
      'img.lazy, img.lazyloaded',
      true,
      500,
      false
    );
    
    // Kiểm tra
    expect(mockedAxios.get).toHaveBeenCalledWith('https://vnexpress.net/du-lich/diem-den');
    expect(mockedCheerio.load).toHaveBeenCalled();
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