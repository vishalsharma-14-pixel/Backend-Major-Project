import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname)//if more then 1 file with same name is upload it will cause error
  }
})

export const upload = multer({ storage, })