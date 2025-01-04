const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 2325;

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const userList = {};
const topicList = {
  "과일": [
    "사과",
    "배",
    "포도",
    "딸기",
    "수박",
    "바나나",
    "귤",
  ],
  "음료수": [
    "콜라",
    "사이다",
    "물",
    "커피",
    "녹차",
  ],
  "학교": [
    "책상",
    "의자",
    "칠판",
    "연필",
    "책",
  ],
  "스포츠": [
    "축구",
    "야구",
    "농구",
    "배구",
  ],
  "교통수단": [
    "지하철",
    "버스",
    "자전거",
    "택시"
  ],
};

const randomKey = (obj) => {
  const keys = Object.keys(obj); // Object에서 키 목록 추출
  const randomIndex = Math.floor(Math.random() * keys.length); // 랜덤 인덱스 생성
  return keys[randomIndex]; // 랜덤 키 반환
};

function getRandomItem(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

var manageWs;

wss.on('connection', (ws) => {
  // console.log('WebSocket 연결 성공');

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    const sendUserList = () => {
      const users = Object.keys(userList).map((key) => ({
        user: key,
        image: userList[key].image || "",
      }));
      if(manageWs) manageWs.send(JSON.stringify({ type: 'userList', users }));
    };

    if(data) {
      console.log(data);

      if (data.type === 'requestUserList') {
        manageWs = ws;
        sendUserList();
      }
      
      if (data.type === 'selectTopic') {
        const spyKey = randomKey(userList);
        const topic = getRandomItem(topicList[data.topic]);
      
        Object.keys(userList).forEach((key) => {
          if (key !== spyKey) {
            const ws = userList[key].ws;
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'topic', topic }));
            }
          }
          else {
            const ws = userList[key].ws;
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'topic', topic: "스파이😎" }));
            }
          }
        });
      
        if (manageWs && manageWs.readyState === WebSocket.OPEN) {
          manageWs.send(
            JSON.stringify({
              type: 'spyAssigned',
              spy: spyKey,
              topic,
            })
          );
        }
      
        console.log(`스파이: ${spyKey}, 주제: ${topic}`);
      }

      if(data.type === 'join') {
        userList[data.user] = {
          "ws": ws,
          "image": "",
        };
      }

      if(data.type === 'leave') {
        delete userList[data.user];
        sendUserList();
      }

      if(data.type === 'upload') {
        userList[data.user]["image"] = data.src;
        sendUserList();
      }
    }
  });

  ws.on('close', () => {
    // console.log('WebSocket 연결 종료');
  });
});

app.get('/', (req, res) => {
  res.send('WebSocket 서버 실행 중');
});

server.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});