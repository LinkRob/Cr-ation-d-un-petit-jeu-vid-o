// Canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Adapter le canvas à l'écran
function fit() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
fit();
window.addEventListener('resize', fit);

// Jeu
let score = 0, lives = 3, gameOver = false;
const player = { x: innerWidth/2, y: innerHeight/2, speed: 280, size: 18 };
const keys = {}, bullets = [], enemies = [];

let mouse = { x: innerWidth/2, y: innerHeight/2, down:false };

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('pointermove', e => mouse.x = e.clientX);
canvas.addEventListener('pointerdown', e => mouse.down = true);
canvas.addEventListener('pointerup', e => mouse.down = false);

// Fonctions
function rand(min,max){ return Math.random()*(max-min)+min; }
function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
function shoot(fromX, fromY, angle){ bullets.push({ x: fromX, y: fromY, vx: Math.cos(angle)*600, vy: Math.sin(angle)*600, size:4, life:2 }); }

let fireCooldown = 0, spawnTimer = 0;

// Spawn ennemis
function spawnEnemy() {
  const side = Math.floor(rand(0,4));
  let xE=0, yE=0;
  if(side===0){ xE=-30; yE=rand(0,innerHeight); }
  if(side===1){ xE=innerWidth+30; yE=rand(0,innerHeight); }
  if(side===2){ xE=rand(0,innerWidth); yE=-30; }
  if(side===3){ xE=rand(0,innerWidth); yE=innerHeight+30; }
  const angle = Math.atan2(player.y - yE, player.x - xE);
  enemies.push({ x:xE, y:yE, vx:Math.cos(angle)*100, vy:Math.sin(angle)*100, size: 20 });
}

// Boucle principale
let last = performance.now();
function loop(t){
  const dt = Math.min(0.05,(t-last)/1000);
  last=t;
  if(!gameOver) update(dt);
  render();
  requestAnimationFrame(loop);
}

// Update
function update(dt){
  // Joueur
  const up = keys['z'] || keys['arrowup'], down = keys['s'] || keys['arrowdown'], left = keys['q'] || keys['arrowleft'], right = keys['d'] || keys['arrowright'];
  let ax=0, ay=0; if(left) ax-=1; if(right) ax+=1; if(up) ay-=1; if(down) ay+=1;
  if(ax || ay){ const m=Math.hypot(ax,ay); ax/=m; ay/=m; }
  player.x+=ax*player.speed*dt; player.y+=ay*player.speed*dt;
  player.x = Math.max(10, Math.min(innerWidth-10, player.x));
  player.y = Math.max(10, Math.min(innerHeight-10, player.y));

  // Tir
  fireCooldown -= dt;
  if(mouse.down && fireCooldown<=0){ 
    const angle=Math.atan2(mouse.y-player.y, mouse.x-player.x); 
    shoot(player.x,player.y,angle); 
    fireCooldown=0.12; 
  }

  // Bullets
  for(let i=bullets.length-1;i>=0;i--){ 
    const b=bullets[i]; b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt; 
    if(b.life<=0 || b.x<-50||b.x>innerWidth+50||b.y<-50||b.y>innerHeight+50) bullets.splice(i,1); 
  }

  // Ennemis
  spawnTimer -= dt; 
  if(spawnTimer<=0){ spawnEnemy(); spawnTimer=1; }
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    e.x+=e.vx*dt; e.y+=e.vy*dt;

    // Collision joueur
    if(dist(e,player)<(e.size+player.size)){ enemies.splice(i,1); lives--; document.getElementById('lives').textContent='Vies : '+lives; if(lives<=0) gameOver=true; continue; }

    // Collision bullets
    for(let j=bullets.length-1;j>=0;j--){ const b=bullets[j]; if(dist(e,b)<(e.size+b.size)){ bullets.splice(j,1); score+=5; document.getElementById('score').textContent='Score : '+score; enemies.splice(i,1); break; } }
  }
}

// Render
function render(){
  ctx.fillStyle="#0b1220"; ctx.fillRect(0,0,canvas.width,canvas.height);

  // Joueur
  ctx.beginPath(); ctx.arc(player.x,player.y,player.size,0,Math.PI*2); ctx.fillStyle="#7FFFD4"; ctx.fill();

  // Bullets
  bullets.forEach(b=>{ ctx.beginPath(); ctx.arc(b.x,b.y,b.size,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill(); });

  // Ennemis
  enemies.forEach(e=>{ ctx.beginPath(); ctx.arc(e.x,e.y,e.size,0,Math.PI*2); ctx.fillStyle="#FF6B6B"; ctx.fill(); });

  // Game Over
  if(gameOver){
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,innerWidth,innerHeight);
    ctx.fillStyle='#fff'; ctx.font='bold 36px system-ui'; ctx.textAlign='center';
    ctx.fillText('GAME OVER', innerWidth/2, innerHeight/2-20);
    ctx.font='20px system-ui';
    ctx.fillText('Appuyez sur R pour rejouer', innerWidth/2, innerHeight/2+20);
  }
}

// Rejouer
window.addEventListener('keydown', e => { if(e.key.toLowerCase()==='r' && gameOver){ score=0;lives=3;gameOver=false;enemies.length=0;bullets.length=0; player.x=innerWidth/2;player.y=innerHeight/2;document.getElementById('score').textContent='Score : '+score;document.getElementById('lives').textContent='Vies : '+lives; }});

// Lancement
requestAnimationFrame(loop);
