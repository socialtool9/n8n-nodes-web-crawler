"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidImageUrl = isValidImageUrl;
exports.normalizeImageUrl = normalizeImageUrl;
exports.isBase64Image = isBase64Image;
exports.getImageSize = getImageSize;
const axios_1 = __importDefault(require("axios"));
const url_1 = require("url");
const sizeOf = __importStar(require("image-size"));
const http_proxy_agent_1 = require("http-proxy-agent");
const https_proxy_agent_1 = require("https-proxy-agent");
/**
 * Kiểm tra xem URL có phải là URL hình ảnh hợp lệ hay không
 */
function isValidImageUrl(url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowercaseUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowercaseUrl.endsWith(ext)) ||
        lowercaseUrl.includes('/image') ||
        lowercaseUrl.includes('/img') ||
        lowercaseUrl.startsWith('data:image/');
}
/**
 * Chuẩn hóa URL hình ảnh, xử lý cả tương đối và tuyệt đối
 */
function normalizeImageUrl(imageUrl, baseUrl) {
    if (!imageUrl)
        return '';
    if (imageUrl.startsWith('data:'))
        return imageUrl;
    try {
        const url = new url_1.URL(imageUrl, baseUrl);
        return url.href;
    }
    catch (e) {
        return imageUrl;
    }
}
/**
 * Kiểm tra xem chuỗi có phải là base64 hình ảnh không
 */
function isBase64Image(str) {
    return str.startsWith('data:image/') && str.includes('base64,');
}
/**
 * Lấy kích thước của hình ảnh từ URL
 */
async function getImageSize(url, proxy, timeout = 15000) {
    if (isBase64Image(url)) {
        try {
            const base64Data = url.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const dimensions = sizeOf.imageSize(buffer);
            return {
                width: dimensions.width,
                height: dimensions.height
            };
        }
        catch (error) {
            return { width: undefined, height: undefined };
        }
    }
    try {
        const config = {
            responseType: 'arraybuffer',
            timeout
        };
        if (proxy) {
            if (url.startsWith('https://')) {
                config.httpsAgent = new https_proxy_agent_1.HttpsProxyAgent(proxy);
            }
            else {
                config.httpAgent = new http_proxy_agent_1.HttpProxyAgent(proxy);
            }
        }
        const imageDataPromise = axios_1.default.get(url, config);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), timeout);
        });
        const response = await Promise.race([imageDataPromise, timeoutPromise]);
        const buffer = response.data;
        const dimensions = sizeOf.imageSize(buffer);
        return {
            width: dimensions.width,
            height: dimensions.height
        };
    }
    catch (error) {
        if (error.message === 'Timeout') {
            return { width: undefined, height: undefined, timeout: true };
        }
        return { width: undefined, height: undefined };
    }
}
//# sourceMappingURL=imageUtils.js.map