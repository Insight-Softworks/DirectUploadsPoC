import {Image} from 'react-native-image-crop-picker';
import * as axios from 'axios';

interface IReceipt {
  title: string;
  description: string;
  amount: string;
  images: string[];
}

interface IDraftAttachment {
  signature: {
    url: 'https://bucket.s3.region.amazonaws.com/etc';
    headers: {
      'Content-Disposition': "inline; filename=...; filename*=UTF-8''...";
      'Content-MD5': '3Tbhfs6EB0ukAPTziowN0A==';
      'Content-Type': 'image/jpeg';
    };
    signed_id: 'signedidoftheblob';
  };
  file: Image;
}

interface IBlob {
  filename: string;
  byte_size: string;
  checksum: string;
  content_type: string;
}

const apiBase = 'http://localhost:3000/api';

export default class Api {
  async uploadAttachment(
    attachment: IDraftAttachment,
    onProgress: (progress: number, total: number) => void,
  ): Promise<void> {
    console.log('Uploading attachment to:', attachment.signature);

    await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', attachment.signature.url, true);

      Object.keys(attachment.signature.headers).forEach(key => {
        xhr.setRequestHeader(key, attachment.signature.headers[key]);
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) {
          return;
        }
        if (xhr.status === 200) {
          return resolve();
        }
        reject(xhr.status);
      };
      xhr.onprogress = e => {
        onProgress(e.loaded, e.total);
      };
      xhr.send({
        uri: attachment.file.sourceURL,
        type: attachment.file.mime,
        name: attachment.file.filename || Date.now().toString(),
      });
    });
  }

  async createReceipt(receipt: IReceipt): Promise<number> {
    const result = await axios.post(`${apiBase}/receipts`, {receipt});
    return result.data;
  }

  async directUploads(blob: IBlob): Promise<number> {
    const result = await axios.post(`${apiBase}/direct_uploads`, {blob});
    return result.data;
  }
}
