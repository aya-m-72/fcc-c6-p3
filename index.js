require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns')
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const shortenUrlSchema = new mongoose.Schema({
  original_url:String,
  short_url:Number,
})

const ShortenUrl = mongoose.model('ShortenUrl',shortenUrlSchema)

// Basic Configuration

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl',(req,res)=>{
  let url = req.body.url

  const urlObj = new URL(url)
  
  dns.lookup(urlObj.hostname, async (err,address)=>{
    if (err){
      res.json({
        "error":"Invalid URL"
      })
    }else{
      //get rid of slash ending
      if (url.endsWith('/')){
        url = url.slice(0,-1)
      }
      
      //check whether url is present in db, if not add it 
      const checkResult = await ShortenUrl.findOne({original_url:url})
      if (checkResult){
        res.json({
          "original_url":checkResult.original_url,
          "short_url":checkResult.short_url
        })
      }else{
        const count = await ShortenUrl.countDocuments({})
        const inst = new ShortenUrl({original_url:url,short_url:count})
        inst.save()
        res.json({
          "original_url":inst.original_url,
          "short_url":inst.short_url
        })
      }

    }
  })
})

app.get('/api/shorturl',(req,res)=>{
  res.send('Not found')
})

app.get('/api/shorturl/:short',async (req,res)=>{
  const short = +req.params.short
  //check if short present in db, if not display error
  const checkResult = await ShortenUrl.findOne({short_url:short})
  if (checkResult){
    res.redirect(checkResult.original_url)
  }else{
    res.json({
      "error":"No short URL found for the given input"
    })
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
