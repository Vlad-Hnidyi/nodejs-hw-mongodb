import multer from 'multer';
import { TEMP_UPLOAD_DIR } from '../constants/index.js';
import createHttpError from 'http-errors';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, `${uniqueSuffix}_${file.originalname}`);
  },
});
const limits = {
  fileSize: 1024 * 1024 * 5,
};

const fileFilter = (req, file, cd) => {
  const extention = file.originalname.split('.').pop();
  if (extention === 'exe') {
    return cd(createHttpError(400, 'File with .exe extention not allow'));
  }
  cd(null, true);
};

export const upload = multer({ storage, limits, fileFilter });
