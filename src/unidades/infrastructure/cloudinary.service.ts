import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';

@Injectable()
export class CloudinaryService {
  async subirFotosUnidad(unidadId: number, archivos: Buffer[]): Promise<string[]> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new DomainValidationError(
        'El servicio de imagenes no esta configurado.',
        null,
        'SERVICIO_NO_CONFIGURADO',
      );
    }

    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    const folder = `${process.env.CLOUDINARY_FOLDER ?? 'syemape/unidades'}/${unidadId}`;

    return Promise.all(
      archivos.map(
        (archivo) =>
          new Promise<string>((resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder,
                  resource_type: 'image',
                  transformation: [{ quality: 'auto', fetch_format: 'auto' }],
                },
                (error, resultado?: UploadApiResponse) => {
                  if (error || !resultado?.secure_url) {
                    reject(error ?? new Error('Cloudinary no devolvio una URL segura.'));
                    return;
                  }
                  resolve(resultado.secure_url);
                },
              )
              .end(archivo);
          }),
      ),
    );
  }
}
