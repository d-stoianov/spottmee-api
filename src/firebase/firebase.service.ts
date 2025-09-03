import { Injectable } from '@nestjs/common'

import * as admin from 'firebase-admin'
import { dirname, extname, basename, join } from 'path'

console.log(
    'process.env.FIREBASE_SERVICE_ACCOUNT_B64',
    process.env.FIREBASE_SERVICE_ACCOUNT_B64,
)
const FIREBASE_SERVICE_ACCOUNT: admin.ServiceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64!, 'base64').toString(
        'utf-8',
    ),
)

const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET ?? ''

@Injectable()
export class FirebaseService {
    private app: admin.app.App

    onModuleInit() {
        this.app = admin.initializeApp({
            credential: admin.credential.cert(FIREBASE_SERVICE_ACCOUNT),
            storageBucket: FIREBASE_STORAGE_BUCKET,
        })

        console.log('Firebase initialized: ', this.app.options)
    }

    getAuth() {
        return admin.auth()
    }

    getStorage() {
        return admin.storage()
    }

    public getPublicBucketLink() {
        const bucketName = this.getStorage().bucket().name

        return `https://storage.googleapis.com/${bucketName}`
    }

    public async listFiles(prefix: string) {
        const bucket = this.getStorage().bucket()

        const [files] = await bucket.getFiles({ prefix })
        return files.map((file) => file.name)
    }

    public async uploadFile(
        file: Express.Multer.File,
        folder: string,
    ): Promise<string> {
        const bucket = this.getStorage().bucket()

        // normalize and check for duplicates
        const safeFileName = await this.getAvailableFileName(
            `${folder}/${file.originalname}`,
        )

        const blob = bucket.file(safeFileName)
        await blob.save(file.buffer, { contentType: file.mimetype })

        await blob.makePublic()

        return `${this.getPublicBucketLink()}/${blob.name}`
    }

    async deleteFile(filePath: string): Promise<void> {
        const bucket = this.getStorage().bucket()
        const file = bucket.file(filePath)

        try {
            await file.delete()
        } catch (error) {
            console.error(
                `Failed to delete file from the bucket: ${filePath}`,
                error,
            )
            throw error
        }
    }

    private async getAvailableFileName(filePath: string): Promise<string> {
        const dir = dirname(filePath) // e.g. "chatbot-widget-icons/123"
        const ext = extname(filePath) // e.g. ".png"
        const base = basename(filePath, ext)
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '') // normalize filename to safe characters

        let candidate = `${base}${ext}`
        let counter = 1

        while (
            await this.fileExists(
                dir === '.' ? candidate : join(dir, candidate),
            )
        ) {
            candidate = `${base}(${counter})${ext}`
            counter++
        }

        return dir === '.' ? candidate : join(dir, candidate)
    }

    private async fileExists(fileName: string): Promise<boolean> {
        const file = this.getStorage().bucket().file(fileName)
        const [exists] = await file.exists()
        return exists
    }
}
