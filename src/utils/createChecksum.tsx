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

const genChecksumAndUploadAttachment = async image => {
  const hex = await RNFS.hash(image.path, 'md5');
  const base64 = Buffer.from(hex, 'hex').toString('base64');
  const blob = {
    filename: image.filename || Date.now().toString(),
    content_type: image.mime,
    byte_size: image.size,
    checksum: base64,
  };
  const data = await api.directUploads(blob);
  const attachment = {
    signature: data.direct_upload,
    file: image,
  };
  await api.uploadAttachment(attachment, onProgress);
  return data.signed_id;
};

export const openCamera = async () => {
  const image = (await ImagePicker.openCamera({
    width: 300,
    height: 400,
    cropping: true,
  })) as ImagePickerImage[];
  const signedIds = [];
  const signedId = await genChecksumAndUploadAttachment(image);
  signedIds.push(signedId);
  return signedIds;
};

// call openImageLibrary from a <Button> or similar
export const openImageLibrary = async () => {
  const results = (await ImagePicker.openPicker(options)) as ImagePickerImage[];
  const signedIds = [];
  await Promise.all(
    results.map(async image => {
      const signedId = await genChecksumAndUploadAttachment(image);
      signedIds.push(signedId);
    }),
  );

  return signedIds;
};
