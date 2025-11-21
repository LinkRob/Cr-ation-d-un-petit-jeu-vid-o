// Récupération du canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Adapter le canvas à l'écran
function fit() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
fit();
window.addEventListener('resize', fit);

// État du jeu
let score = 0;
let lives = 3;
let gameOver = false;

// Joueur
const player = { x: innerWidth/2, y: innerHeight/2, speed: 280, size: 18, color: '#7FFFD4', vx:0, vy:0 };

// Contrôles
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Souris / tactile
let mouse = { x: innerWidth/2, y: innerHeight/2, down:false };
canvas.addEventListener('pointermove', e => mouse.x = e.clientX);
canvas.addEventListener('pointerdown', e => mouse.down = true);
canvas.addEventListener('pointerup', e => mouse.down = false);

// Entités
const bullets = [];
const enemies = [];
const particles = [];

// Fonctions utiles
function rand(min,max){ return Math.random()*(max-min)+min; }
function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }

// Tir
let fireCooldown = 0;
function shoot(fromX, fromY, angle) {
  bullets.push({ x: fromX, y: fromY, vx: Math.cos(angle)*600, vy: Math.sin(angle)*600, size:4, life:2 });
}

// Spawn ennemis
let spawnTimer = 0;
function spawnEnemy() {
  const side = Math.floor(rand(0,4));
  let x,y;
  if(side===0){ x = -30; y = rand(0, innerHeight); }
  if(side===1){ x = innerWidth+30; y = rand(0, innerHeight); }
  if(side===2){ x = rand(0, innerWidth); y = -30; }
  if(side===3){ x = rand(0, innerWidth); y = innerHeight+30; }
  const angle = Math.atan2(player.y - y, player.x - x);
  enemies.push({ x, y, vx: Math.cos(angle)*rand(40,120), vy: Math.sin(angle)*rand(40,120), size: rand(12,26), hp:1 });
}

// Particules
function spawnParticles(x,y,color,count=10){
  for(let i=0;i<count;i++){
    particles.push({ x, y, vx: rand(-200,200), vy: rand(-200,200), life: rand(0.4,1.2), size: rand(1,4), color });
  }
}

// Boucle du jeu
let last = performance.now();
function loop(t){
  const dt = Math.min(0.05, (t-last)/1000);
  last = t;
  if(!gameOver) update(dt);
  render();
  requestAnimationFrame(loop);
}

// Mise à jour
function update(dt){
  // Déplacement joueur
  const up = keys['w'] || keys['arrowup'];
  const down = keys['s'] || keys['arrowdown'];
  const left = keys['a'] || keys['arrowleft'];
  const right = keys['d'] || keys['arrowright'];
  let ax=0, ay=0;
  if(left) ax -= 1;
  if(right) ax += 1;
  if(up) ay -= 1;
  if(down) ay += 1;
  if(ax || ay){ const m = Math.hypot(ax,ay); ax/=m; ay/=m; }
  player.x += ax * player.speed * dt;
  player.y += ay * player.speed * dt;
  player.x = Math.max(10, Math.min(innerWidth-10, player.x));
  player.y = Math.max(10, Math.min(innerHeight-10, player.y));

  // Tir automatique
  fireCooldown -= dt;
  if(mouse.down && fireCooldown <= 0){
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    shoot(player.x, player.y, angle);
    fireCooldown = 0.12;
  }

  // Bullets
  for(let i=bullets.length-1;i>=0;i--){
    const b = bullets[i];
    b.x += b.vx*dt;
    b.y += b.vy*dt;
    b.life -= dt;
    if(b.life <= 0 || b.x < -50 || b.x > innerWidth+50 || b.y < -50 || b.y > innerHeight+50) bullets.splice(i,1);
  }

  // Ennemis
  spawnTimer -= dt;
  if(spawnTimer <= 0){ spawnEnemy(); spawnTimer = Math.max(0.4,1.6-Math.min(1.2,score/40)); }
  for(let i=enemies.length-1;i>=0;i--){
    const e = enemies[i];
    const ax2 = (player.x - e.x);
    const ay2 = (player.y - e.y);
    const m = Math.hypot(ax2,ay2)||1;
    const speed = Math.hypot(e.vx,e.vy);
    e.vx += (ax2/m) * 10 * dt;
    e.vy += (ay2/m) * 10 * dt;
    const sp = Math.hypot(e.vx,e.vy);
    if(sp>220){ e.vx*=220/sp; e.vy*=220/sp; }

    e.x += e.vx*dt;
    e.y += e.vy*dt;

    // Collision joueur
    if(dist(e,player)<(e.size+player.size)){
      spawnParticles(player.x,player.y,'#FF6B6B',18);
      enemies.splice(i,1);
      lives -= 1;
      document.getElementById('lives').textContent = 'Vies : ' + lives;
      if(lives<=0) gameOver = true;
      continue;
    }

    // Bullets vs ennemi
    for(let j=bullets.length-1;j>=0;j--){
      const b = bullets[j];
      if(Math.hypot(e.x-b.x,e.y-b.y)<(e.size+b.size)){
        bullets.splice(j,1);
        spawnParticles(e.x,e.y,'#FFD66B',12);
        score += 5;
        document.getElementById('score').textContent = 'Score : ' + score;
        enemies.splice(i,1);
        break;
      }
    }
  }

  // Particles
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx*dt;
    p.y += p.vy*dt;
    p.vy += 400*dt;
    if(p.life<=0) particles.splice(i,1);
  }
}

// Rendu
function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Joueur
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.size,0,Math.PI*2);
  ctx.fillStyle = player.color;
  ctx.fill();

  // Bullets
  for(const b of bullets){
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.size,0,Math.PI*2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  // Ennemis
  for(const e of enemies){
    ctx.beginPath();
    ctx.arc(e.x,e.y,e.size,0,Math.PI*2);
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();
  }

  // Particles
  for(const p of particles){
    ctx.globalAlpha = Math.max(0,p.life/1.2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x,p.y,p.size,p.size);
    ctx.globalAlpha = 1;
  }

  // Game Over
  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,innerWidth,innerHeight);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', innerWidth/2, innerHeight/2-20);
    ctx.font = '20px system-ui';
    ctx.fillText('Appuyez sur R pour rejouer', innerWidth/2, innerHeight/2+20);
  }
}

// Rejouer
window.addEventListener('keydown', e => {
  if(e.key.toLowerCase()==='r' && gameOver){
    score = 0; lives = 3; gameOver = false;
    enemies.length = 0; bullets.length = 0; particles.length = 0;
    player.x = innerWidth/2; player.y = innerHeight/2;
    document.getElementById('score').textContent = 'Score : ' + score;
    document.getElementById('lives').textContent = 'Vies : ' + lives;
  }
});

// Démarrage
requestAnimationFrame(loop);
