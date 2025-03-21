import { IExecuteFunctions } from 'n8n-workflow';
import { INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as mysql from 'mysql2/promise';
import * as pg from 'pg';
import { URL } from 'url';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import { pipeline } from 'stream';
import sizeOf from 'image-size';

export class WebCrawler implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Web Crawler',
		name: 'webCrawler',
		group: ['transform'],
		version: 1,
		description: 'Truy cập URL và lấy nội dung văn bản cùng đường dẫn hình ảnh',
		defaults: {
			name: 'Web Crawler',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'crawlPage',
				options: [
					{
						name: 'Cào Dữ Liệu Trang Web',
						value: 'crawlPage',
						description: 'Truy cập URL và lấy nội dung văn bản cùng đường dẫn hình ảnh',
					},
					{
						name: 'Lấy Bài Viết Ngẫu Nhiên',
						value: 'randomArticle',
						description: 'Lấy ngẫu nhiên một bài viết từ trang web và lưu vào cơ sở dữ liệu',
					},
					{
						name: 'Lấy Bài Viết Từ Cơ Sở Dữ Liệu',
						value: 'getFromDatabase',
						description: 'Lấy bài viết đã lưu từ cơ sở dữ liệu',
					},
					{
						name: 'Cập Nhật Trạng Thái Bài Viết',
						value: 'updateArticleStatus',
						description: 'Cập nhật trạng thái bài viết trong cơ sở dữ liệu',
					},
				],
			},

			// Các trường chung
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://example.com',
				description: 'URL của trang web cần cào dữ liệu',
				required: true,
				displayOptions: {
					show: {
						operation: ['crawlPage', 'randomArticle'],
					},
				},
			},

			// Trường cho việc cào trang
			{
				displayName: 'Selector cho nội dung văn bản',
				name: 'textSelector',
				type: 'string',
				default: 'body',
				description: 'CSS selector để lựa chọn phần tử chứa nội dung văn bản',
				displayOptions: {
					show: {
						operation: ['crawlPage'],
					},
				},
			},
			{
				displayName: 'Selector cho hình ảnh',
				name: 'imageSelector',
				type: 'string',
				default: 'img',
				description: 'CSS selector để lựa chọn các phần tử hình ảnh',
				displayOptions: {
					show: {
						operation: ['crawlPage'],
					},
				},
			},
			{
				displayName: 'Lọc hình ảnh theo kích thước',
				name: 'filterImagesBySize',
				type: 'boolean',
				default: false,
				description: 'Chỉ lấy hình ảnh có kích thước lớn hơn giá trị đã chỉ định',
				displayOptions: {
					show: {
						operation: ['crawlPage'],
					},
				},
			},
			{
				displayName: 'Kích thước tối thiểu (px)',
				name: 'minImageSize',
				type: 'number',
				default: 300,
				description: 'Chỉ lấy hình ảnh có kích thước (chiều rộng hoặc chiều cao) lớn hơn giá trị này',
				displayOptions: {
					show: {
						operation: ['crawlPage'],
						filterImagesBySize: [true],
					},
				},
			},
			{
				displayName: 'Kiểm tra kích thước thực tế của hình ảnh',
				name: 'checkActualImageSize',
				type: 'boolean',
				default: true,
				description: 'Tải hình ảnh để kiểm tra kích thước thực (chậm hơn nhưng chính xác hơn)',
				displayOptions: {
					show: {
						operation: ['crawlPage'],
						filterImagesBySize: [true],
					},
				},
			},

			// Trường cho việc lấy bài viết ngẫu nhiên
			{
				displayName: 'Selector cho bài viết',
				name: 'articleSelector',
				type: 'string',
				default: 'article, .post, .article',
				description: 'CSS selector để lựa chọn các phần tử bài viết',
				displayOptions: {
					show: {
						operation: ['randomArticle'],
					},
				},
			},
			{
				displayName: 'Selector cho tiêu đề bài viết',
				name: 'titleSelector',
				type: 'string',
				default: 'h1, h2, .title',
				description: 'CSS selector để lựa chọn tiêu đề bài viết',
				displayOptions: {
					show: {
						operation: ['randomArticle'],
					},
				},
			},
			{
				displayName: 'Selector cho liên kết bài viết',
				name: 'linkSelector',
				type: 'string',
				default: 'a',
				description: 'CSS selector để lựa chọn liên kết bài viết',
				displayOptions: {
					show: {
						operation: ['randomArticle'],
					},
				},
			},
			{
				displayName: 'Loại cơ sở dữ liệu',
				name: 'databaseType',
				type: 'options',
				default: 'mysql',
				options: [
					{
						name: 'MySQL',
						value: 'mysql',
					},
					{
						name: 'PostgreSQL',
						value: 'postgresql',
					},
				],
				displayOptions: {
					show: {
						operation: ['randomArticle', 'getFromDatabase', 'updateArticleStatus'],
					},
				},
			},
			{
				displayName: 'Kết nối cơ sở dữ liệu',
				name: 'databaseConnection',
				type: 'string',
				default: '',
				placeholder: 'mysql://user:password@localhost:3306/database',
				description: 'Chuỗi kết nối đến cơ sở dữ liệu',
				required: true,
				displayOptions: {
					show: {
						operation: ['randomArticle', 'getFromDatabase', 'updateArticleStatus'],
					},
				},
			},
			{
				displayName: 'Tên bảng',
				name: 'tableName',
				type: 'string',
				default: 'web_articles',
				description: 'Tên bảng lưu trữ bài viết',
				displayOptions: {
					show: {
						operation: ['randomArticle', 'getFromDatabase', 'updateArticleStatus'],
					},
				},
			},
			{
				displayName: 'ID Bài Viết',
				name: 'articleId',
				type: 'string',
				default: '',
				description: 'ID của bài viết cần cập nhật trạng thái',
				required: true,
				displayOptions: {
					show: {
						operation: ['getFromDatabase', 'updateArticleStatus'],
					},
				},
			},
			{
				displayName: 'Trạng thái mới',
				name: 'newStatus',
				type: 'options',
				default: 'done',
				options: [
					{
						name: 'Chưa xử lý',
						value: 'pending',
					},
					{
						name: 'Đã xử lý',
						value: 'done',
					},
					{
						name: 'Đã bỏ qua',
						value: 'skipped',
					},
				],
				description: 'Trạng thái mới cho bài viết',
				displayOptions: {
					show: {
						operation: ['updateArticleStatus'],
					},
				},
			},
			{
				displayName: 'Tạo bảng nếu chưa tồn tại',
				name: 'createTableIfNotExists',
				type: 'boolean',
				default: true,
				description: 'Tạo bảng trong cơ sở dữ liệu nếu chưa tồn tại',
				displayOptions: {
					show: {
						operation: ['randomArticle'],
					},
				},
			},
		],
	};

	// Hàm để tạo bảng MySQL
	private static async createMySQLTable(connection: mysql.Connection, tableName: string): Promise<void> {
		const createTableQuery = `
			CREATE TABLE IF NOT EXISTS ${tableName} (
				id VARCHAR(100) PRIMARY KEY,
				title VARCHAR(500) NOT NULL,
				link VARCHAR(1000) NOT NULL,
				content TEXT,
				status VARCHAR(20) DEFAULT 'pending',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
			)
		`;

		await connection.query(createTableQuery);
	}

	// Hàm để tạo bảng PostgreSQL
	private static async createPostgresTable(client: pg.Client, tableName: string): Promise<void> {
		// Kiểm tra xem cột status đã tồn tại chưa
		const checkColumnQuery = `
			DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT 1 FROM information_schema.columns 
					WHERE table_name = '${tableName}' AND column_name = 'status'
				) THEN
					ALTER TABLE ${tableName} ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
				END IF;
			END $$;
		`;

		const createTableQuery = `
			CREATE TABLE IF NOT EXISTS ${tableName} (
				id VARCHAR(100) PRIMARY KEY,
				title VARCHAR(500) NOT NULL,
				link VARCHAR(1000) NOT NULL,
				content TEXT,
				status VARCHAR(20) DEFAULT 'pending',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`;

		// Tạo trigger để cập nhật updated_at
		const createTriggerQuery = `
			DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT 1 FROM pg_trigger WHERE tgname = '${tableName}_updated_at_trigger'
				) THEN
					CREATE OR REPLACE FUNCTION update_timestamp()
					RETURNS TRIGGER AS $$
					BEGIN
						NEW.updated_at = CURRENT_TIMESTAMP;
						RETURN NEW;
					END;
					$$ LANGUAGE plpgsql;

					CREATE TRIGGER ${tableName}_updated_at_trigger
					BEFORE UPDATE ON ${tableName}
					FOR EACH ROW
					EXECUTE FUNCTION update_timestamp();
				END IF;
			END $$;
		`;

		await client.query(createTableQuery);
		await client.query(createTriggerQuery);
	}

	// Hàm để lưu bài viết vào MySQL
	private static async saveArticleToMySQL(
		connection: mysql.Connection,
		tableName: string,
		articleId: string,
		title: string,
		link: string,
		content: string = '',
	): Promise<void> {
		const insertQuery = `
			INSERT INTO ${tableName} (id, title, link, content, status)
			VALUES (?, ?, ?, ?, 'pending')
		`;

		await connection.query(insertQuery, [articleId, title, link, content]);
	}

	// Hàm để lưu bài viết vào PostgreSQL
	private static async saveArticleToPostgres(
		client: pg.Client,
		tableName: string,
		articleId: string,
		title: string,
		link: string,
		content: string = '',
	): Promise<void> {
		const insertQuery = `
			INSERT INTO ${tableName} (id, title, link, content, status)
			VALUES ($1, $2, $3, $4, 'pending')
		`;

		await client.query(insertQuery, [articleId, title, link, content]);
	}

	// Hàm để lấy bài viết từ MySQL theo ID
	private static async getArticleFromMySQL(
		connection: mysql.Connection,
		tableName: string,
		articleId: string,
	): Promise<any> {
		const selectQuery = `
			SELECT * FROM ${tableName} WHERE id = ?
		`;

		const [rows] = await connection.query(selectQuery, [articleId]);
		if (Array.isArray(rows) && rows.length > 0) {
			return rows[0];
		}
		
		throw new Error(`Không tìm thấy bài viết với ID: ${articleId}`);
	}

	// Hàm để lấy bài viết từ PostgreSQL theo ID
	private static async getArticleFromPostgres(
		client: pg.Client,
		tableName: string,
		articleId: string,
	): Promise<any> {
		const selectQuery = `
			SELECT * FROM ${tableName} WHERE id = $1
		`;

		const result = await client.query(selectQuery, [articleId]);
		if (result.rows.length > 0) {
			return result.rows[0];
		}
		
		throw new Error(`Không tìm thấy bài viết với ID: ${articleId}`);
	}

	// Hàm kiểm tra kích thước thực tế của hình ảnh
	private static async getImageSize(imageUrl: string): Promise<{ width?: number; height?: number }> {
		try {
			const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
			const buffer = Buffer.from(response.data, 'binary');
			const dimensions = sizeOf(buffer);
			return {
				width: dimensions.width,
				height: dimensions.height,
			};
		} catch (error) {
			console.error(`Lỗi khi lấy kích thước hình ảnh ${imageUrl}:`, error);
			return { width: undefined, height: undefined };
		}
	}

	// Hàm để cập nhật trạng thái bài viết trong MySQL
	private static async updateArticleStatusInMySQL(
		connection: mysql.Connection,
		tableName: string,
		articleId: string,
		status: string,
	): Promise<void> {
		const updateQuery = `
			UPDATE ${tableName} 
			SET status = ?
			WHERE id = ?
		`;

		const [result] = await connection.query(updateQuery, [status, articleId]);
		
		// @ts-ignore
		if (result.affectedRows === 0) {
			throw new Error(`Không tìm thấy bài viết với ID: ${articleId}`);
		}
	}

	// Hàm để cập nhật trạng thái bài viết trong PostgreSQL
	private static async updateArticleStatusInPostgres(
		client: pg.Client,
		tableName: string,
		articleId: string,
		status: string,
	): Promise<void> {
		const updateQuery = `
			UPDATE ${tableName} 
			SET status = $1
			WHERE id = $2
		`;

		const result = await client.query(updateQuery, [status, articleId]);
		
		if (result.rowCount === 0) {
			throw new Error(`Không tìm thấy bài viết với ID: ${articleId}`);
		}
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		
		// Lấy loại thao tác
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				if (operation === 'crawlPage') {
					// Thực hiện cào dữ liệu trang web như trước đây
					const url = this.getNodeParameter('url', itemIndex) as string;
					const textSelector = this.getNodeParameter('textSelector', itemIndex) as string;
					const imageSelector = this.getNodeParameter('imageSelector', itemIndex) as string;
					
					// Tham số lọc hình ảnh theo kích thước
					const filterImagesBySize = this.getNodeParameter('filterImagesBySize', itemIndex, false) as boolean;
					let minImageSize = 300;
					let checkActualImageSize = true;
					
					if (filterImagesBySize) {
						minImageSize = this.getNodeParameter('minImageSize', itemIndex, 300) as number;
						checkActualImageSize = this.getNodeParameter('checkActualImageSize', itemIndex, true) as boolean;
					}

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
							let fullSrc: string;
							if (src.startsWith('//')) {
								fullSrc = `https:${src}`;
							} else if (src.startsWith('/')) {
								const urlObj = new URL(url);
								fullSrc = `${urlObj.origin}${src}`;
							} else if (!src.startsWith('http')) {
								const urlObj = new URL(url);
								fullSrc = `${urlObj.origin}/${src}`;
							} else {
								fullSrc = src;
							}
							
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
									const dimensions = await WebCrawler.getImageSize(image.src);
									
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
					const newItem: INodeExecutionData = {
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

					returnData.push(newItem);
				} else if (operation === 'randomArticle') {
					// Lấy các tham số
					const url = this.getNodeParameter('url', itemIndex) as string;
					const articleSelector = this.getNodeParameter('articleSelector', itemIndex) as string;
					const titleSelector = this.getNodeParameter('titleSelector', itemIndex) as string;
					const linkSelector = this.getNodeParameter('linkSelector', itemIndex) as string;
					const databaseType = this.getNodeParameter('databaseType', itemIndex) as string;
					const databaseConnection = this.getNodeParameter('databaseConnection', itemIndex) as string;
					const tableName = this.getNodeParameter('tableName', itemIndex) as string;
					const createTableIfNotExists = this.getNodeParameter('createTableIfNotExists', itemIndex) as boolean;

					// Gửi yêu cầu HTTP
					const response = await axios.get(url);
					const html = response.data;

					// Load HTML vào Cheerio
					const $ = cheerio.load(html);

					// Tìm tất cả các bài viết
					const articles: Array<{ title: string; link: string; content?: string }> = [];
					$(articleSelector).each((_, articleElement) => {
						// Trích xuất tiêu đề
						const title = $(articleElement).find(titleSelector).first().text().trim();
						
						// Trích xuất liên kết
						let link = $(articleElement).find(linkSelector).first().attr('href') || '';
						
						// Chuẩn hóa đường dẫn
						if (link && link.startsWith('/')) {
							const urlObj = new URL(url);
							link = `${urlObj.origin}${link}`;
						} else if (link && !link.startsWith('http')) {
							const urlObj = new URL(url);
							link = `${urlObj.origin}/${link}`;
						}
						
						if (title && link) {
							articles.push({ title, link });
						}
					});

					// Kiểm tra có bài viết không
					if (articles.length === 0) {
						throw new Error(`Không tìm thấy bài viết nào với selector: ${articleSelector}`);
					}

					// Chọn ngẫu nhiên 1 bài viết
					const randomIndex = Math.floor(Math.random() * articles.length);
					const selectedArticle = articles[randomIndex];

					// Tạo ID ngẫu nhiên cho bài viết
					const articleId = `article_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
					
					// Kết nối và lưu vào cơ sở dữ liệu
					let dbResult;
					if (databaseType === 'mysql') {
						const connection = await mysql.createConnection(databaseConnection);
						
						try {
							if (createTableIfNotExists) {
								await WebCrawler.createMySQLTable(connection, tableName);
							}
							
							// Lấy nội dung bài viết nếu cần
							let content = '';
							try {
								const articleResponse = await axios.get(selectedArticle.link);
								const articleHtml = articleResponse.data;
								const $article = cheerio.load(articleHtml);
								content = $article('body').text().trim();
								selectedArticle.content = content;
							} catch (error) {
								// Bỏ qua lỗi khi lấy nội dung bài viết
								console.error(`Không thể lấy nội dung từ ${selectedArticle.link}:`, error);
							}
							
							await WebCrawler.saveArticleToMySQL(
								connection,
								tableName,
								articleId,
								selectedArticle.title,
								selectedArticle.link,
								content,
							);
							
							dbResult = {
								success: true,
								id: articleId,
								type: 'mysql',
							};
						} finally {
							await connection.end();
						}
					} else if (databaseType === 'postgresql') {
						const client = new pg.Client(databaseConnection);
						await client.connect();
						
						try {
							if (createTableIfNotExists) {
								await WebCrawler.createPostgresTable(client, tableName);
							}
							
							// Lấy nội dung bài viết nếu cần
							let content = '';
							try {
								const articleResponse = await axios.get(selectedArticle.link);
								const articleHtml = articleResponse.data;
								const $article = cheerio.load(articleHtml);
								content = $article('body').text().trim();
								selectedArticle.content = content;
							} catch (error) {
								// Bỏ qua lỗi khi lấy nội dung bài viết
								console.error(`Không thể lấy nội dung từ ${selectedArticle.link}:`, error);
							}
							
							await WebCrawler.saveArticleToPostgres(
								client,
								tableName,
								articleId,
								selectedArticle.title,
								selectedArticle.link,
								content,
							);
							
							dbResult = {
								success: true,
								id: articleId,
								type: 'postgresql',
							};
						} finally {
							await client.end();
						}
					} else {
						throw new Error(`Loại cơ sở dữ liệu không được hỗ trợ: ${databaseType}`);
					}
					
					// Chuẩn bị dữ liệu đầu ra
					const newItem: INodeExecutionData = {
						json: {
							operation: 'randomArticle',
							databaseType,
							articleId,
							tableName,
							article: selectedArticle,
							database: dbResult,
							message: `Đã lưu bài viết "${selectedArticle.title}" vào cơ sở dữ liệu ${databaseType}`,
						},
					};

					returnData.push(newItem);
				} else if (operation === 'getFromDatabase') {
					// Lấy các tham số
					const databaseType = this.getNodeParameter('databaseType', itemIndex) as string;
					const databaseConnection = this.getNodeParameter('databaseConnection', itemIndex) as string;
					const tableName = this.getNodeParameter('tableName', itemIndex) as string;
					const articleId = this.getNodeParameter('articleId', itemIndex) as string;

					// Lấy dữ liệu từ cơ sở dữ liệu
					let article;
					if (databaseType === 'mysql') {
						const connection = await mysql.createConnection(databaseConnection);
						
						try {
							article = await WebCrawler.getArticleFromMySQL(connection, tableName, articleId);
						} finally {
							await connection.end();
						}
					} else if (databaseType === 'postgresql') {
						const client = new pg.Client(databaseConnection);
						await client.connect();
						
						try {
							article = await WebCrawler.getArticleFromPostgres(client, tableName, articleId);
						} finally {
							await client.end();
						}
					} else {
						throw new Error(`Loại cơ sở dữ liệu không được hỗ trợ: ${databaseType}`);
					}
					
					// Nếu có link bài viết, cập nhật lại nội dung mới nhất
					if (article && article.link) {
						try {
							const articleResponse = await axios.get(article.link);
							const articleHtml = articleResponse.data;
							const $article = cheerio.load(articleHtml);
							const freshContent = $article('body').text().trim();
							
							article.fresh_content = freshContent;
						} catch (error) {
							// Bỏ qua lỗi khi lấy nội dung mới
							console.error(`Không thể lấy nội dung mới từ ${article.link}:`, error);
						}
					}
					
					// Chuẩn bị dữ liệu đầu ra
					const newItem: INodeExecutionData = {
						json: {
							operation: 'getFromDatabase',
							databaseType,
							tableName,
							article,
							message: `Đã lấy bài viết từ cơ sở dữ liệu ${databaseType}`,
						},
					};

					returnData.push(newItem);
				} else if (operation === 'updateArticleStatus') {
					// Lấy các tham số
					const databaseType = this.getNodeParameter('databaseType', itemIndex) as string;
					const databaseConnection = this.getNodeParameter('databaseConnection', itemIndex) as string;
					const tableName = this.getNodeParameter('tableName', itemIndex) as string;
					const articleId = this.getNodeParameter('articleId', itemIndex) as string;
					const newStatus = this.getNodeParameter('newStatus', itemIndex) as string;

					// Cập nhật trạng thái trong cơ sở dữ liệu
					let result;
					if (databaseType === 'mysql') {
						const connection = await mysql.createConnection(databaseConnection);
						
						try {
							await WebCrawler.updateArticleStatusInMySQL(connection, tableName, articleId, newStatus);
							
							// Lấy thông tin bài viết sau khi cập nhật
							const [rows] = await connection.query(
								`SELECT * FROM ${tableName} WHERE id = ?`,
								[articleId]
							);
							
							if (Array.isArray(rows) && rows.length > 0) {
								result = {
									success: true,
									article: rows[0],
									message: `Đã cập nhật trạng thái của bài viết thành "${newStatus}"`,
								};
							}
						} finally {
							await connection.end();
						}
					} else if (databaseType === 'postgresql') {
						const client = new pg.Client(databaseConnection);
						await client.connect();
						
						try {
							await WebCrawler.updateArticleStatusInPostgres(client, tableName, articleId, newStatus);
							
							// Lấy thông tin bài viết sau khi cập nhật
							const { rows } = await client.query(
								`SELECT * FROM ${tableName} WHERE id = $1`,
								[articleId]
							);
							
							if (rows.length > 0) {
								result = {
									success: true,
									article: rows[0],
									message: `Đã cập nhật trạng thái của bài viết thành "${newStatus}"`,
								};
							}
						} finally {
							await client.end();
						}
					} else {
						throw new Error(`Loại cơ sở dữ liệu không được hỗ trợ: ${databaseType}`);
					}
					
					// Chuẩn bị dữ liệu đầu ra
					const newItem: INodeExecutionData = {
						json: {
							operation: 'updateArticleStatus',
							databaseType,
							tableName,
							articleId,
							status: newStatus,
							...result,
						},
					};

					returnData.push(newItem);
				}
			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
} 