import { Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'

import * as admin from 'firebase-admin'

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

    async uploadFile(path: string, file: Express.Multer.File): Promise<string> {
        const bucket = this.getStorage().bucket()
        const fileExtension = file.originalname.split('.').pop()
        const fileId = uuidv4()
        const fileName = `${path}/${fileId}.${fileExtension}`

        const blob = bucket.file(fileName)

        await blob.save(file.buffer, {
            contentType: file.mimetype,
        })

        await blob.makePublic()
        const url = `https://storage.googleapis.com/${bucket.name}/${blob.name}`

        return url
    }
}
