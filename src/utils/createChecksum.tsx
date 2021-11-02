import {Buffer} from 'buffer';
import RNFS from 'react-native-fs';
import ImagePicker, {
  Image as ImagePickerImage,
  Options as ImagePickerOptions,
} from 'react-native-image-crop-picker';
import Api from '../services/api';

const api = new Api();

// https://github.com/ivpusic/react-native-image-crop-picker#request-object
const options: ImagePickerOptions = {
  cropping: false,
  multiple: true,
  sortOrder: 'asc',
  maxFiles: 10,
  // we don't need the base64 here as we upload the file directly
  // from the FS rather than a base64-encoded string of it
  includeBase64: false,
};

const onProgress = (progress, total) => {
  console.log('Progress', progress);
  console.log('Total', total);
};

// call openImageLibrary from a <Button> or similar
export const openImageLibrary = async () => {
  const results = (await ImagePicker.openPicker(options)) as ImagePickerImage[];
  const signedIds = [];
  await Promise.all(
    results.map(async r => {
      const hex = await RNFS.hash(r.path, 'md5');
      const base64 = Buffer.from(hex, 'hex').toString('base64');
      const blob = {
        filename: r.filename || Date.now().toString(),
        content_type: r.mime,
        byte_size: r.size,
        checksum: base64,
      };
      const data = await api.directUploads(blob);
      const attachment = {
        signature: data.direct_upload,
        file: r,
      };
      await api.uploadAttachment(attachment, onProgress);
      signedIds.push(data.signed_id);
    }),
  );

  return signedIds;
};
