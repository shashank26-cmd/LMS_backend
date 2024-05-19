import path from "path";
import multer from "multer";
const __dirname = path.resolve();

const uploadPath = path.join(__dirname,'..','uploads/')
// console.log(uploadPath)
const upload = multer({
  dest: uploadPath,
  limits: { fileSize: 80 * 1024 * 1024 }, // 50 mb in size max limit
  storage: multer.diskStorage({
    destination: uploadPath,
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);

    if (
      ext !== ".jpg" &&
      ext !== ".jpeg" &&
      ext !== ".webp" &&
      ext !== ".png" &&
      ext !== ".mp4"
    ) {
      cb(new Error(`Unsupported file type! ${ext}`), false);
      return;
    }

    cb(null, true);
  },
});

export default upload;
