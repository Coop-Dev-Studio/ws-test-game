const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let myId = null;
let myColor = null;
let myX = 0;
let myY = 0;

const remotePlayers = new Map();


const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${window.location.host}`;
const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log("Connected to server");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  switch (message.type) {
    case "init":
      myId = message.id;
      myColor = message.color;
      console.log(`My id: ${myId}, color: ${myColor}`);
      break;
    case "new_player":
      remotePlayers.set(message.id, {
        x: message.x,
        y: message.y,
        color: message.color,
      });
      console.log(`New player: ${message.id}, color: ${message.color}`);
      break;
    case 'mouse_move':
      if (remotePlayers.has(message.id)) {
        const player = remotePlayers.get(message.id);
        player.x = message.x;
        player.y = message.y;
      } else {
        remotePlayers.set(message.id, {
          x: message.x,
          y: message.y,
          color: message.color,
        });
      }
      break;
    case 'player_left':
      remotePlayers.delete(message.id);
      console.log(`Player ${message.id} left`);
      break;
  }
};

ws.onclose = () => {
  console.log("Disconnected from server");
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

canvas.addEventListener('mousemove', (event) => {
  const x = event.clientX;
  const y = event.clientY;
  const message = {
    type: 'mouse_move',
    x,
    y,
    id: myId,
  };
  ws.send(JSON.stringify(message));
});

const render = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const player of remotePlayers.values()) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = player.color;
    ctx.fill();
  }

  window.requestAnimationFrame(render);
};

render();
