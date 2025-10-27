import { Injectable, OnModuleInit } from '@nestjs/common'
import * as tf from '@tensorflow/tfjs-node'
import * as nsfwjs from 'nsfwjs'
import { Tensor3D } from '@tensorflow/tfjs-node'

@Injectable()
export class NsfwService implements OnModuleInit {
    private model: nsfwjs.NSFWJS

    async onModuleInit() {
        console.log('Loading NSFW model...')
        this.model = await nsfwjs.load('MobileNetV2')
        console.log('NSFW model ready')
    }

    async isSafeImage(imageBuffer: Buffer): Promise<boolean> {
        const imageTensor = tf.node.decodeImage(imageBuffer, 3) as Tensor3D
        const predictions = await this.model.classify(imageTensor)
        imageTensor.dispose()

        const nsfwLabels = ['Porn', 'Hentai', 'Sexy']
        const isUnsafe = predictions.some(
            (p) => nsfwLabels.includes(p.className) && p.probability > 0.45,
        )

        if (isUnsafe) {
            return false
        }

        return true
    }
}
