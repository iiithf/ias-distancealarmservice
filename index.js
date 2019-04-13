const express = require('express');
const needle = require('needle');
const http = require('http');



const E = process.env;
const PORT = parseInt(E['PORT']||'8000', 10);
const SOURCE = E['SOURCE']||'';
const TARGET = E['TARGET']||'';
const DATARATE = parseInt(E['DATARATE']||'1000', 10);
const app = express();
const server = http.createServer(app);
var status = '', dtime = new Date();



function statusGet(distance) {
  var d = distance;
  if(d<=100) return 'EMERGENCY STOP '+d;
  if(d<=200) return 'CRITICAL '+d;
  return 'ALL FINE '+d;
}

function responseGet(options) {
  var {time, distance} = options;
  status = statusGet(distance);
  return {time, distance, status};
}

async function onInterval() {
  if(!SOURCE) return;
  var res = await needle('get', SOURCE);
  console.log('SOURCE', SOURCE, res.body);
  if(!TARGET) return;
  var data = responseGet(res.body);
  dtime = data.time;
  res = await needle('post', TARGET, data, {json: true});
  console.log('TARGET', TARGET, data);
}
setInterval(onInterval, DATARATE);



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
  var data = responseGet(req.body);
  dtime = data.time;
  res.json(data);
  if(!TARGET) return;
  needle('post', TARGET, data, {json: true}).then(() => {
    console.log('TARGET', TARGET, data);
  }, next);
});

app.use((err, req, res, next) => {
  console.log(err, err.stack);
  res.status(err.statusCode||500).send(err.json||err);
});
server.listen(PORT, () => {
  console.log('DISTANCEALARMSERVICE running on '+PORT);
});
