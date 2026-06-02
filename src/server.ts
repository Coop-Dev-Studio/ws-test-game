import 'dotenv/config';
import express from 'express';
import http from 'http';
import {
  WebSocketServer,
  WebSocket,
} from 'ws';


const PORT = process.env.PORT || 80;


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


const broadcastExceptSelf = (
  playerWS: WebSocket | null,
  data: object,
) => {
  const message = JSON.stringify(data);
  players.forEach((player) => {
    if (player.ws !== playerWS && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(message);
    }
  });
};



wss.on('connection', (ws: WebSocket) => {
  const player = createPlayer(ws);
  players.set(player.id, player);
  console.log(`Player ${player.id} connected, color: ${player.color}`);

  ws.send(JSON.stringify({
    type: 'init',
    id: player.id,
    color: player.color,
  }));

  broadcastExceptSelf(ws, {
    type: 'new_player',
    id: player.id,
    color: player.color,
  });

  ws.on('message', (rawData) => {
    try {
      const data = JSON.parse(rawData.toString());
      if (data.type === 'mouse_move') {
        player.x = data.x;
        player.y = data.y;
        broadcastExceptSelf(ws, {
          type: 'mouse_move',
          id: player.id,
          x: player.x,
          y: player.y,
          color: player.color,
        });
      }
    } catch (error) {
      console.error(`Uncaught error: ${error}`);
    }
  });

  ws.on('close', () => {
    players.delete(player.id);
    console.log(`Player ${player.id} disconnected`);
    broadcastExceptSelf(ws, {
      type: 'player_left',
      id: player.id,
    })
  });

  ws.on('error', (error) => {
    console.error(`Error from player ${player.id}:`, error.message);
  })
});



app.get('/players', (_req, res) => {
  res.json(
    [...players.values()]
      .map(({ id, x, y, color }) => ({ id, x, y, color }))
  );
});


server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
