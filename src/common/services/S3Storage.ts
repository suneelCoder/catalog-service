// import {
//     DeleteObjectCommand,
//     PutObjectCommand,
//     S3Client,
// } from "@aws-sdk/client-s3";
// import config from "config";
// import { FileData, FileStorage } from "../types/storage";
// import createHttpError from "http-errors";

// export class S3Storage implements FileStorage {
//     private client: S3Client;

//     constructor() {
//         this.client = new S3Client({
//             region: config.get("s3.region"),
//             credentials: {
//                 accessKeyId: config.get("s3.accessKeyId"),
//                 secretAccessKey: config.get("s3.secretAccessKey"),
//             },
//         });
//     }
//     async upload(data: FileData): Promise<void> {
//         const objectParams = {
//             Bucket: config.get("s3.bucket"),
//             Key: data.filename,
//             Body: data.fileData,
//         };

//         // todo: add proper filedata type
//         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//         // @ts-ignore
//         return await this.client.send(new PutObjectCommand(objectParams));
//     }

//     async delete(filename: string): Promise<void> {
//         const objectParams = {
//             Bucket: config.get("s3.bucket"),
//             Key: filename,
//         };

//         // todo: add proper filedata type
//         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//         // @ts-ignore
//         return await this.client.send(new DeleteObjectCommand(objectParams));
//     }
//     getObjectUri(filename: string): string {
//         // https://mernspace-project.s3.ap-south-1.amazonaws.com/5962624d-1b9e-4c96-b1d6-395ca9ef4933
//         const bucket = config.get("s3.bucket");
//         const region = config.get("s3.region");

//         if (typeof bucket === "string" && typeof region === "string") {
//             return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
//         }
//         const error = createHttpError(500, "Invalid S3 configuration");
//         throw error;
//     }
// }




import { v2 as cloudinary } from 'cloudinary';
import config from 'config';
import { FileData, FileStorage } from '../types/storage';
import createHttpError from 'http-errors';

export class S3Storage implements FileStorage {
    constructor() {
        cloudinary.config({
            cloud_name: config.get('cloudinary.cloudName'),
            api_key: config.get('cloudinary.apiKey'),
            api_secret: config.get('cloudinary.apiSecret'),
        });
    }

    async upload(data: FileData): Promise<void> {
        try {
            // Convert ArrayBuffer to Buffer
            const buffer = Buffer.from(data.fileData);

            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        public_id: data.filename,
                        resource_type: 'auto'
                    },
                    (error, result) => {
                        if (error) {
                            return reject(createHttpError(500, `Upload failed: ${error.message}`));
                        }
                        resolve(result);
                    }
                );

                // Write the buffer data to the upload stream
                uploadStream.end(buffer);
            });
        } catch (error) {
            throw createHttpError(500, `Failed to upload to Cloudinary: ${(error as Error).message}`);
        }
    }

    async delete(filename: string): Promise<void> {
        try {
            const result = await cloudinary.uploader.destroy(filename);
            if (result.result !== 'ok') {
                throw createHttpError(404, `File not found: ${filename}`);
            }
        } catch (error) {
            throw createHttpError(500, `Failed to delete from Cloudinary: ${(error as Error).message}`);
        }
    }

    getObjectUri(filename: string): string {
        const cloudName = config.get('cloudinary.cloudName');
        if (typeof cloudName === 'string') {
            return `https://res.cloudinary.com/${cloudName}/image/upload/${filename}`;
        }
        const error = createHttpError(500, 'Invalid Cloudinary configuration');
        throw error;
    }
}

