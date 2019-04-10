const express = require('express');
const needle = require('needle');
const http = require('http');



const E = process.env;
const PORT = parseInt(E['PORT']||'8000', 10);
const TARGET = E['TARGET']||'';
const app = express();
const server = http.createServer(app);
var status = '', dtime = new Date();



function statusGet(distance) {
  var d = distance;
  if(d<=100) return 'EMERGENCY STOP '+d;
  if(d<=200) return 'CRITICAL '+d;
  return 'ALL FINE '+d;
}



app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use((req, res, next) => {
  Object.assign(req.body, req.query);
  var {ip, method, url, body} = req;
  if(method!=='GET') console.log(ip, method, url, body);
  next();
});

app.get('/status', (req, res) => {
  res.json({time: dtime, status});
});
app.post('/status', (req, res) => {
  var {distance} = req.body;
  status = statusGet(distance);
  dtime = new Date();
  var data = {time: dtime, status};
  res.json(data);
  if(!TARGET) return;
  needle('post', TARGET, data, {json: true}).then(() => {
    console.log('POST', TARGET, data);
  }, next);
});

app.use((err, req, res, next) => {
  console.log(err, err.stack);
  res.status(err.statusCode||500).send(err.json||err);
});
server.listen(PORT, () => {
  console.log('DISTANCEALARMSERVICE running on '+PORT);
});
