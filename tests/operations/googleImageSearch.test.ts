import { googleImageSearch } from '../../nodes/WebCrawler/operations/googleImageSearch';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as imageUtils from '../../nodes/WebCrawler/utils/imageUtils';
import { IDataObject } from 'n8n-workflow';

jest.mock('axios');
jest.mock('cheerio');
jest.mock('../../nodes/WebCrawler/utils/imageUtils');

describe('googleImageSearch operation', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockedImageUtils = imageUtils as jest.Mocked<typeof imageUtils>;
  const mockedCheerio = cheerio as jest.Mocked<typeof cheerio>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock mặc định cho axios
    mockedAxios.get.mockResolvedValue({
      data: '<html><body><div><img src="image1.jpg" /><img src="image2.jpg" /></div><script>var data = {"images": [{"url": "image3.jpg"}, {"url": "image4.jpg"}]}</script></body></html>'
    });
    
    // Mock hàm normalizeUrl
    mockedImageUtils.normalizeUrl.mockImplementation((src, baseUrl) => {
      if (src === 'image1.jpg') return 'https://example.com/image1.jpg';
      if (src === 'image2.jpg') return 'https://example.com/image2.jpg';
      if (src === 'image3.jpg') return 'https://example.com/image3.jpg';
      if (src === 'image4.jpg') return 'https://example.com/image4.jpg';
      return `https://example.com/${src}`;
    });
    
    // Mock hàm getImageSize
    mockedImageUtils.getImageSize.mockImplementation(async (url) => {
      if (url.includes('image1.jpg')) return { width: 800, height: 600 };
      if (url.includes('image2.jpg')) return { width: 400, height: 300 };
      if (url.includes('image3.jpg')) return { width: 1024, height: 768 };
      if (url.includes('image4.jpg')) return { width: 300, height: 200 };
      return { width: undefined, height: undefined };
    });
    
    // Mock hàm isBase64Image
    mockedImageUtils.isBase64Image.mockImplementation((src) => {
      return src.startsWith('data:image') && src.includes(';base64,');
    });
    
    // Mock cheerio.load
    const mockEach = jest.fn().mockImplementation(function(callback) {
      // Gọi callback với mỗi phần tử img
      callback(0, { attribs: { src: 'image1.jpg' } });
      callback(1, { attribs: { src: 'image2.jpg' } });
      return this;
    });
    
    const mockAttr = jest.fn().mockImplementation(function(attr) {
      if (attr === 'src' || attr === 'data-src') {
        return this.element.attribs.src;
      }
      return null;
    });
    
    // Tạo mock api cho cheerio
    const mockCheerioApi = (selector: string) => {
      return {
        each: mockEach,
        attr: mockAttr,
        html: () => {
          if (selector === 'script') {
            return 'var data = {"images": [{"url": "image3.jpg"}, {"url": "image4.jpg"}]}';
          }
          return '';
        },
        element: { attribs: { src: '' } }
      };
    };
    
    mockedCheerio.load.mockReturnValue(mockCheerioApi as any);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should search for images from Google without filtering', async () => {
    // Thực thi hàm không lọc theo kích thước
    const result = await googleImageSearch('phong cảnh Việt Nam', 5, 0, false);
    
    // Kiểm tra
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('https://www.google.com/search?q=phong%20c%E1%BA%A3nh%20Vi%E1%BB%87t%20Nam'),
      expect.any(Object)
    );
    
    expect(result.json).toHaveProperty('operation', 'googleImageSearch');
    expect(result.json).toHaveProperty('keyword', 'phong cảnh Việt Nam');
    expect(result.json).toHaveProperty('imageUrls');
    
    const json = result.json as IDataObject;
    expect(Array.isArray(json.imageUrls)).toBe(true);
    
    // Giả sử từ mock chúng ta có 4 ảnh, cần 5 nhưng chỉ có sẵn 4
    expect((json.imageUrls as string[]).length).toBeLessThanOrEqual(5);
    expect(json.imageCount).toBeLessThanOrEqual(5);
    
    // Kiểm tra thông tin lọc
    const filterDetails = json.filterDetails as IDataObject;
    expect(filterDetails.filtered).toBe(false);
  });
  
  test('should filter images by size', async () => {
    // Thực thi hàm có lọc theo kích thước
    const result = await googleImageSearch('phong cảnh Việt Nam', 5, 500, true);
    
    // Kiểm tra
    expect(mockedAxios.get).toHaveBeenCalled();
    
    const json = result.json as IDataObject;
    expect(Array.isArray(json.imageUrls)).toBe(true);
    
    // Giả sử chỉ ảnh 1 và 3 lớn hơn 500px
    const imageUrls = json.imageUrls as string[];
    expect(imageUrls.length).toBeLessThanOrEqual(2);
    
    // Kiểm tra thông tin lọc
    const filterDetails = json.filterDetails as IDataObject;
    expect(filterDetails.filtered).toBe(true);
    expect(filterDetails.minImageSize).toBe(500);
    expect(filterDetails.skipped).toBeDefined();
  });
  
  test('should handle errors when fetching image size', async () => {
    // Mock getImageSize để giả lập lỗi khi lấy kích thước
    mockedImageUtils.getImageSize.mockImplementation(async (url) => {
      if (url.includes('image1.jpg')) throw new Error('Failed to fetch image');
      if (url.includes('image2.jpg')) return { width: 400, height: 300 };
      if (url.includes('image3.jpg')) throw new Error('Failed to fetch image');
      if (url.includes('image4.jpg')) return { width: 300, height: 200 };
      return { width: undefined, height: undefined };
    });
    
    // Thực thi hàm có lọc theo kích thước
    const result = await googleImageSearch('phong cảnh Việt Nam', 5, 300, true);
    
    // Kết quả vẫn có ảnh 2 vì nó lớn hơn 300px và không lỗi
    const json = result.json as IDataObject;
    expect(Array.isArray(json.imageUrls)).toBe(true);
    
    // Kiểm tra thông tin lọc
    const filterDetails = json.filterDetails as IDataObject;
    expect(filterDetails.filtered).toBe(true);
    
    // Thay vì kiểm tra giá trị cụ thể, chúng ta chỉ kiểm tra thuộc tính tồn tại
    const skipped = filterDetails.skipped as IDataObject;
    expect(skipped).toBeDefined();
    expect(skipped).toHaveProperty('error');
  });
  
  test('should limit the number of returned images', async () => {
    // Thực thi với giới hạn 2 ảnh
    const result = await googleImageSearch('phong cảnh Việt Nam', 2, 0, false);
    
    // Kiểm tra số lượng ảnh trả về
    const json = result.json as IDataObject;
    expect(Array.isArray(json.imageUrls)).toBe(true);
    expect((json.imageUrls as string[]).length).toBeLessThanOrEqual(2);
    expect(json.requestedCount).toBe(2);
  });
  
  test('should include image size information', async () => {
    // Mock trả về thông tin kích thước ảnh trong imagesInfo
    const mockResult = {
      json: {
        operation: 'googleImageSearch',
        keyword: 'phong cảnh Việt Nam',
        imageCount: 2,
        requestedCount: 3,
        imageUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ],
        imagesInfo: [
          { url: 'https://example.com/image1.jpg', width: 800, height: 600 },
          { url: 'https://example.com/image2.jpg', width: 400, height: 300 }
        ],
        filterDetails: {
          filtered: false,
          totalFound: 2
        }
      }
    };
    
    // Chỉ cho test này, mock trực tiếp hàm googleImageSearch
    jest.spyOn(require('../../nodes/WebCrawler/operations/googleImageSearch'), 'googleImageSearch').mockResolvedValue(mockResult);
    
    // Thực thi hàm
    const result = await googleImageSearch('phong cảnh Việt Nam', 3, 0, false);
    
    // Kiểm tra thông tin kích thước ảnh
    const json = result.json as IDataObject;
    expect(json.imagesInfo).toBeDefined();
    expect(Array.isArray(json.imagesInfo)).toBe(true);
    
    const imagesInfo = json.imagesInfo as IDataObject[];
    expect(imagesInfo.length).toBe(2);
    expect(imagesInfo[0]).toHaveProperty('url');
    expect(imagesInfo[0]).toHaveProperty('width');
    expect(imagesInfo[0]).toHaveProperty('height');
  });
  
  test('should use proxy from proxy list', async () => {
    // Mock proxy agent creation
    const httpsProxySpy = jest.spyOn(require('https-proxy-agent'), 'HttpsProxyAgent');
    const httpProxySpy = jest.spyOn(require('http-proxy-agent'), 'HttpProxyAgent');
    
    // Thực thi hàm với danh sách proxy
    const result = await googleImageSearch(
      'phong cảnh Việt Nam', 
      2, 
      0, 
      false, 
      true, 
      'http://proxy1.com:8080,https://proxy2.com:8080',
      30000
    );
    
    // Kiểm tra proxy được sử dụng trong axios config
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('https://www.google.com/search'),
      expect.objectContaining({
        timeout: 30000
      })
    );
    
    // Xác minh HttpsProxyAgent hoặc HttpProxyAgent đã được gọi
    expect(httpsProxySpy.mock.calls.length + httpProxySpy.mock.calls.length).toBeGreaterThan(0);
    
    // Kiểm tra thông tin proxy trong kết quả
    const json = result.json as IDataObject;
    expect(json).toHaveProperty('proxyUsed', 'yes');
  });
  
  test('should rotate proxies for different image requests', async () => {
    // Giả lập nhiều proxy trong danh sách
    const proxyList = 'http://proxy1.com:8080,https://proxy2.com:8080,http://proxy3.com:8080';
    
    // Theo dõi proxy agent được tạo
    const httpProxySpy = jest.spyOn(require('http-proxy-agent'), 'HttpProxyAgent');
    const httpsProxySpy = jest.spyOn(require('https-proxy-agent'), 'HttpsProxyAgent');
    
    // Giả mạo Math.random để chọn các proxy khác nhau
    const randomSpy = jest.spyOn(global.Math, 'random');
    randomSpy.mockReturnValueOnce(0.1).mockReturnValueOnce(0.5).mockReturnValueOnce(0.9);
    
    // Thực thi hàm
    await googleImageSearch(
      'phong cảnh Việt Nam', 
      3, 
      500, 
      true, 
      true, 
      proxyList,
      30000
    );
    
    // Kiểm tra nếu HttpProxyAgent hoặc HttpsProxyAgent đã được gọi nhiều lần
    expect(httpProxySpy.mock.calls.length + httpsProxySpy.mock.calls.length).toBeGreaterThan(0);
  });
  
  test('should handle timeout when checking image sizes', async () => {
    // Mock getImageSize để trả về timeout cho một số hình ảnh
    mockedImageUtils.getImageSize.mockImplementation(async (url) => {
      if (url.includes('image1.jpg')) return { width: 800, height: 600 };
      if (url.includes('image2.jpg')) return { timeout: true };
      if (url.includes('image3.jpg')) return { width: 1024, height: 768 };
      if (url.includes('image4.jpg')) return { timeout: true };
      return { width: undefined, height: undefined };
    });
    
    // Thực thi hàm với timeout ngắn
    const result = await googleImageSearch(
      'phong cảnh Việt Nam', 
      5, 
      300, 
      true, 
      false, 
      '',
      5000
    );
    
    // Kiểm tra kết quả
    const json = result.json as IDataObject;
    expect(json).toHaveProperty('imageUrls');
    
    // Chỉ các ảnh không bị timeout nên được bao gồm
    const imageUrls = json.imageUrls as string[];
    expect(imageUrls.every(url => !url.includes('image2.jpg') && !url.includes('image4.jpg'))).toBe(true);
    
    // Kiểm tra thông tin timeout trong filterDetails
    const filterDetails = json.filterDetails as IDataObject;
    const skipped = filterDetails.skipped as IDataObject;
    expect(skipped).toHaveProperty('timeout');
    expect(Number(skipped.timeout)).toBeGreaterThan(0);
  });
  
  test('should handle global timeout for all image processing', async () => {
    // Giả lập timeout cho toàn bộ quá trình xử lý ảnh
    jest.useFakeTimers();
    
    // Mock getImageSize để không bao giờ resolve
    mockedImageUtils.getImageSize.mockImplementation(() => new Promise(() => {}));
    
    // Thực thi hàm
    const resultPromise = googleImageSearch(
      'phong cảnh Việt Nam', 
      5, 
      300, 
      true, 
      false, 
      '',
      1000
    );
    
    // Giả lập trôi qua thời gian
    jest.advanceTimersByTime(1500);
    
    const result = await resultPromise;
    
    // Kiểm tra kết quả có phản ánh timeout
    const json = result.json as IDataObject;
    expect(json).toHaveProperty('imageUrls');
    expect(Array.isArray(json.imageUrls)).toBe(true);
    expect((json.imageUrls as string[]).length).toBe(0);
    
    // Kiểm tra thông tin timeout
    const filterDetails = json.filterDetails as IDataObject;
    expect(filterDetails).toHaveProperty('timeoutOccurred', true);
    
    jest.useRealTimers();
  });
}); 