// 全局的图表数据变量
let chartData = {};
let body_data = {};
// http与websocket之间的锁
let http_lock = true;
let ws_lock = true;

const ws = require('nodejs-websocket');
var ws_server;

const test_data = "{\"position\":\"-0.5 -0.5 -1\",\"config\":{\"title\":\"Hello VRIA\",\"data\":{\"values\":[{\"a\":\"A\",\"b\":3,\"c\":\"A\"},{\"a\":\"B\",\"b\":5,\"c\":\"B\"},{\"a\":\"C\",\"b\":7,\"c\":\"C\"},{\"a\":\"D\",\"b\":6,\"c\":\"D\"},{\"a\":\"E\",\"b\":4,\"c\":\"E\"}]},\"mark\":\"bar\",\"encoding\":{\"x\":{\"field\":\"a\",\"type\":\"nominal\"},\"y\":{\"field\":\"b\",\"type\":\"quantitative\",\"axis\":{\"filter\":true}},\"z\":{\"field\":\"c\",\"type\":\"nominal\"}}}}"

// 架设websocket服务，端口为3002
ws_server = ws.createServer(function (socket){
    socket.on('text', function(str) {
        // 将传回的数据传到chartData中
        chartData = JSON.parse(str);
        console.log("收到ws消息");
        // console.log(chartData);

        // 解锁，让http请求回复
        http_lock = false;

    });
    socket.on('connection', function (){
        console.log("收到ws连接");
    })
});

ws_server.listen(3002, function () {
    console.log('端口3002，ws服务启动成功......');
});


// 搭建express服务
const express = require('express');
const http_server = express();

// 设置中间件
http_server.use(express.json());
http_server.use(express.urlencoded({extended:true}));

function set_response(response){
    if(http_lock){
        setTimeout(function (){
            set_response(response);
        }, 20);
    }
    else {
        console.log('回复请求');
        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(chartData));
        response.send();
    }
}

http_server.get('/getChartData', (request, response) => {
    console.log('收到请求');
    let body = request.body;
    // console.log(body);
    http_lock = true;
    ws_server.connections.forEach(function (conn){
        console.log('发送ws消息');
        // console.log(body);
        conn.sendText(JSON.stringify(body));
    })
    set_response(response);

})




http_server.listen(3001, function (){
    console.log('端口3001，http服务启动成功......');
});