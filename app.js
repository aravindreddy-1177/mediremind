
  // The requirements imports
  const cron = require('node-cron');
  const client = require('twilio')('ACa89ea8891f0bd66f6a58377cc076a804','7c9501e04cb05e31092058623737ceed');
  const express = require('express');
  const app = express();
  const fs = require('fs');
  const multer = require('multer');
  const { stringify } = require('querystring');
  const { createWorker } = require('tesseract.js');
  const mongoose = require('mongoose');

  app.set('view engine', 'ejs');
  app.use('/public', express.static('D:/MediRemind/public'));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // globale variables;
  let theText="";
  let str ="";
  let lines=[];
  // The Storage Declaration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads');
    },

    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  });

  const upload = multer({ storage: storage }).single('avatar');





  
 mongoose.connect('mongodb://127.0.0.1:27017/PatientDB',{
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(()=>
      {
      console.log('Connected to the DB');
      })
  .catch((error)=>
      {
      console.log("error occured",error);
      });


 const patientSchema = new mongoose.Schema({
    Name: String,
    Password: String,
    Phone: Number,
});

const Patient = new mongoose.model("Patient", patientSchema);

const medicineSchema = new mongoose.Schema({
    Name: String,
    Medicines: String,
});

const Medicine = new mongoose.model("Medicine", medicineSchema);




  app.post('/upload/:name', (req, res) => {
    upload(req, res, (err) => {
      console.log(req.file);
      fs.readFile(`./uploads/${req.file.originalname}`, async (err, data) => {
        if (err) return console.log('This is your error', err);

        const worker = await createWorker(); // Wait for worker to be created
        await worker.load();
        await worker.initialize('eng');

        try {
          const { data: { text } } = await worker.recognize(data);
          theText=text;
          Alarams(theText);
          
          // for (let i = 0; i < theText.length; i++) {
          //   const element = theText[i];
          //   console.log(element);
          // 
          if(theFlag)
          {
            
            res.render("index2",{
            Name: req.params.name,
            Morn:morMessage,
            After:afMessage,
            Even:niMessage
          });

          }

          
        } finally {

          await worker.terminate();
        }


      });
    });
  });

  let theFlag=false;
  let morMessage="";
  let afMessage="";
  let niMessage="";

  function Alarams(theText) {

  var totalLines = (theText.match(/\n/g) || '').length;
  console.log(totalLines);
  str=theText.replace(/-/gi,"");


  let s ="";
  let i=1;
  console.log("the lines in information extracted from the Image \n");
  for(let j=0;j<str.length;j++)
  {
    if(str[j]!=str[j].match(/\n/g))
    {
      s+=str[j];
    }
    else
    {
      console.log("the line",i,":",s,"\n");
      i++;
      lines.push(s);
      s="";
    }

  morMessage="";
  afMessage="";
  niMessage="";

  console.log("the medicines that need be reminded to the user \n");
  for(let i=0;i<lines.length;i++)
  {
    if(lines[i].match(/morning/gi) )
    {
      
      morMessage=lines[i].replace(/morning/gi,"");
      console.log("the morning medicine :",morMessage,"\n");
    }
    if(lines[i].match(/afternoon/gi) )
    {
      afMessage=lines[i].replace(/afternoon/gi,"");
      console.log("the afternoon medicine :",afMessage,"\n");
    }
    if(lines[i].match(/night/gi))
    {
      niMessage=lines[i].replace(/night/gi,"");
      console.log("the nigth medicine :",niMessage,"\n");
    }
  }
  }
  theFlag=true;
  }


  function sendNotification(_Meds)
  {
      
    let mes = String(_Meds);
    client.messages.create({
      body:`Dont forget to take your ${mes}`,
      to:'+918897231558',
      from:'++447723563766'
    })
    .then(result => console.log("sent the message"+result))
    .catch(error => console.log(error));
    console.log(_Meds);

  }

  cron.schedule('31 10 * * *', () => {
    let me = " Tafenoquine,(ArakodaTM) and Zestril";
      sendNotification(me);
    });

  cron.schedule('59 11 * * *', () => {
      sendNotification(afMessage);
    });

  cron.schedule('44 19 * * *', () => {
      sendNotification(niMessage);
    }); 
    
  


    app.get("/",(req,res)=>{
      res.render("home");

    });

    app.get("/register",(req,res)=>{
      res.render("register");
    })

    app.get("/login",(req,res)=>{
      res.render("login");
    })

    app.get("/MediRemind/:name",(req,res)=>{
      res.render("index",{
        Name:req.params.name,
      });
    });

    app.post("/register",(req,res)=>{
      const newUser = new Patient({
        Name:req.body.name,
        Password: req.body.password,
        Number:req.body.number
    });
    
    newUser.save()
        .then((result)=>
        {
            console.log("entered the new Patient details into the DB");
            res.redirect(`/MediRemind/${result.Name}`)

        })
        .catch((error)=>
        {
            console.log("error occurred while entering the details",error);
        });
    })

    app.post("/login",(req,res)=>{

      const Name = req.body.username;
      const Password = req.body.password;
      Patient.findOne({Name: Name})
        .then((result)=>
            {
              if(result)
              {
                  if(result.Password === Password)
                  {
                      console.log("found",result);
                      res.redirect(`/MediRemind/${result.Name}`);
                    
                  }
                      else
                      {
                          console.log("username or password",username,password,"do not exist");
                          res.render("login");
                      }
              }                                
                })
                .catch((error)=>
                {
                    console.error("error while searching for the credentials",error);
                });
          });
    
  const PORT = process.env.PORT || 5000;


  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });


  //   One last step - save your recovery code
  //   If you lose your phone, or don't have access to your verification device, this code is your failsafe to access your account.
  //   HQQGBTH1JL1SAL6KMZ69RVDY