import 'dotenv/config';
import express from 'express';
import http from 'http';
import {
  WebSocketServer,
  WebSocket,
} from 'ws';


const PORT = process.env.PORT || 3000;


const app = express();

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

app.use(express.static('./public'));
app.use(express.json());


interface Player {
  ws: WebSocket;
  id: number;
  x: number;
  y: number;
  color: string;
}
const players = new Map<number, Player>();

let nextPlayerId = 0;


const createPlayer = (ws: WebSocket) => {
  const player = {
    ws,
    id: nextPlayerId++,
    x: 0,
    y: 0,
    color: `hsl(${Math.random() * 360}, 50%, 50%)`,
  };
  return player;
};



wss.on('connection', (ws: WebSocket) => {
  const player = createPlayer(ws);
  players.set(player.id, player);

  console.log(`Player ${player.id} connected, color: ${player.color}`);

  ws.on('close', () => {
    players.delete(player.id);
    console.log(`Player ${player.id} disconnected`);
  });

  ws.on('error', (error) => {
    console.error(`Error from player ${player.id}:`, error.message);
  })
});



app.get('/players', (_req, res) => {
  res.json([...players.values()]);
});


server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
