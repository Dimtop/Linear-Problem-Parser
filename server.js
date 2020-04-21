const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer  = require('multer');
const upload = multer({dest:path.join(__dirname ,'/tmp')});
const lpparser =  require('./lpparser');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT | 5000;


//config

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,"public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


console.log(path.join(__dirname, "public"));
//routes
app.get("/", (req,res)=>{

    fs.readdir('./tmp', (err,files)=>{
        if(err){
            console.log(err);
        }
        else{
            for(var i=0;i<files.length;i++){
                fs.unlink(path.join(__dirname, 'tmp',files[i]), (err) =>{
                    if(err){
                        console.log(err);
                    }
                });
            }
        }
    });
    res.render(path.join(__dirname, "/public/app.ejs"),{errors:""});

   
});

app.get("*", (req,res)=>{
    res.redirect("/");
});

app.post("/", upload.single('inputFile'),  (req,res)=>{

    var content =  lpparser((path.join(__dirname,'tmp',req.file.filename))).content;
    var hasErrors =  lpparser((path.join(__dirname,'tmp',req.file.filename))).hasErrors;
    console.log(hasErrors);
    if(hasErrors){
        res.render(path.join(__dirname, "/public/app.ejs"),{errors:content});
    }
    else{
        fs.writeFile(path.join(__dirname,'tmp',"output.txt"), content, (err)=>{
            if(err){
                throw err;
            }
            else{
                res.download( path.join(__dirname,'tmp',"output.txt"));
            }
          
        });
    }
   

    console.log(content);


});
    

app.listen(PORT, (err)=>{
    if (err){
        console.log(err);
    }
    else{
        console.log("Up and running on port: "  + PORT);
    }
});