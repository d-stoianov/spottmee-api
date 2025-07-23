import { Injectable } from '@nestjs/common'
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

@Injectable()
export class FirebaseService {
    private app: admin.app.App

    onModuleInit() {
        this.app = admin.initializeApp({
            credential: admin.credential.cert(FIREBASE_SERVICE_ACCOUNT),
        })

        console.log('Firebase initialized: ', this.app.options)
    }

    getAuth() {
        return admin.auth()
    }
}
