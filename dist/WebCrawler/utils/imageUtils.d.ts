export declare function isBase64Image(src: string): boolean;
export declare function getBase64Buffer(base64String: string): Buffer;
export declare function getImageSize(imageUrl: string): Promise<{
    width?: number;
    height?: number;
}>;
export declare function normalizeUrl(src: string, baseUrl: string): string;
