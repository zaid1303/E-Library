const path=require('path');
const multer=require("multer");

var storage=multer.diskStorage({
    destination:function(req,file,cb){
        const dir="./public/upload/"+file.fieldname;
        cb(null,dir);
    },
    filename:function(req,file,cb){
        let ext = path.ettname(file.originalname);
        cb(null,Date.now()+ext);
    }
    
})

var upload=multer({storage:storage});
