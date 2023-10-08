import path  from "path";
import multer from 'multer';
import exp from "constants";

const upload=multer({
    dest:"uploads/", //destination of file where it will upload
    limits:{fileSize:50*1024*1024},// 50mb in size max limit
    storage:multer.diskStorage({ //where store means in destination /uploads and will store by original name
        destination:"uploads/",
        filename:(_req,file,cb)=>{
            cb(null,file.originalname);
        },
    }),
    fileFilter:(_req,file,cb)=>{ // Filter which file will be accepted
let ext=path.extname(file.originalname);
if(
    ext !==".jpg"&&
    ext !==".jpeg"&&
    ext !==".webp"&&
    ext !==".png"&&
    ext !==".mp4"
){
    cb(new Error(`unsupported file type ${ext}`),false);
    return;
}
cb(null,true);

    },
});
export default upload;