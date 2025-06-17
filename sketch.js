let campo;
let lenhadores = [];
let defesas = [];
let pontuacao = 0;
let saudeCampo = 100;
let energia = 100;
let energiaMax = 100;
let energiaRegen = 0.2;

let cursor = { x: 300, y: 300, size: 10 };
let tipoDefesa = 1;
let cooldownColocar = 20;
let tempoCooldown = 0;

// Fases
let fase = 1;
let tempoFase = 30 * 60;
let cronometroFase = tempoFase;

function setup() {
  createCanvas(600, 400);
  campo = new Campo();
}

function draw() {
  background(101, 67, 33);
  campo.mostrar();

  // Criação progressiva de lenhadores
  if (frameCount % max(10, 60 - fase * 5) === 0) {
    lenhadores.push(new Lenhador(fase));
  }

  for (let i = lenhadores.length - 1; i >= 0; i--) {
    let l = lenhadores[i];
    l.atualizar();
    l.mostrar();

    if (l.atingiuCampo()) {
      saudeCampo -= 10;
      lenhadores.splice(i, 1);
    } else if (l.estaMorto()) {
      pontuacao++;
      lenhadores.splice(i, 1);
    }
  }

  for (let i = defesas.length - 1; i >= 0; i--) {
    defesas[i].atualizar();
    defesas[i].mostrar();
    defesas[i].atacar(lenhadores);
    if (defesas[i].vida <= 0) defesas.splice(i, 1);
  }

  // Energia
  energia = min(energia + energiaRegen, energiaMax);

  // HUD
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  text("Pontuação: " + pontuacao, 20, 20);
  text("Saúde: " + saudeCampo, 20, 40);
  text("Energia: " + int(energia), 20, 60);
  text("Fase: " + fase, 20, 80);
  text("Setas = mover | 1-4 = colocar defesa", 20, 100);

  fill(0, 255, 0);
  rect(20, 120, energia * 2, 10);
  noStroke();
  fill(100);
  rect(20 + energia * 2, 120, (energiaMax - energia) * 2, 10);

  stroke(255);
  noFill();
  rect(cursor.x - cursor.size / 2, cursor.y - cursor.size / 2, cursor.size, cursor.size);

  if (saudeCampo <= 0) {
    textSize(36);
    textAlign(CENTER, CENTER);
    text("FIM DE JOGO", width / 2, height / 2);
    noLoop();
  }

  if (tempoCooldown > 0) tempoCooldown--;

  // FASES
  cronometroFase--;
  if (cronometroFase <= 0) {
    fase++;
    cronometroFase = tempoFase;
    if (fase % 3 === 0) energiaMax += 10;
  }
}

function keyPressed() {
  let step = 20;
  if (keyCode === LEFT_ARROW) cursor.x = max(cursor.x - step, 0);
  if (keyCode === RIGHT_ARROW) cursor.x = min(cursor.x + step, width);
  if (keyCode === UP_ARROW) cursor.y = max(cursor.y - step, 0);
  if (keyCode === DOWN_ARROW) cursor.y = min(cursor.y + step, height);

  if (tempoCooldown <= 0) {
    let custo;
    switch (key) {
      case '1': custo = 10; break;
      case '2': custo = 15; break;
      case '3': custo = 20; break;
      case '4': custo = 25; break;
      default: return;
    }

    if (energia >= custo) {
      tipoDefesa = int(key);
      energia -= custo;
      tempoCooldown = cooldownColocar;

      switch (tipoDefesa) {
        case 1: defesas.push(new EspiritoVerde(cursor.x, cursor.y)); break;
        case 2: defesas.push(new EspiritoGelo(cursor.x, cursor.y)); break;
        case 3: defesas.push(new AnimalGuardiao(cursor.x, cursor.y)); break;
        case 4: defesas.push(new Torre(cursor.x, cursor.y)); break;
      }
    }
  }
}
// CAMPO VISUAL
class Campo {
  mostrar() {
    fill(0, 100, 0);
    rect(0, height * 0.3, width, height * 0.7);
    for (let i = 0; i < 10; i++) {
      let x = 50 + i * 50;
      fill(139, 69, 19);
      rect(x, height * 0.3 - 10, 10, 60);
      fill(0, 150, 0);
      ellipse(x + 5, height * 0.3 - 20, 40, 30);
    }
  }
}

// LENHADOR
class Lenhador {
  constructor(fase = 1) {
    this.x = random([-50, width + 50]);
    this.y = random(height * 0.3, height - 50);
    this.velocidade = 0.8 + fase * 0.2;
    this.tamanho = 20;
    this.vida = 2;
    this.congelado = false;
    this.congelamentoTimer = 0;
  }

  atualizar() {
    if (this.congelado) {
      this.congelamentoTimer--;
      if (this.congelamentoTimer <= 0) this.congelado = false;
      return;
    }
    let dx = width / 2 - this.x;
    let dy = height * 0.2 - this.y;
    let ang = atan2(dy, dx);
    this.x += cos(ang) * this.velocidade;
    this.y += sin(ang) * this.velocidade;
  }

  mostrar() {
    fill(139, 69, 19);
    rect(this.x - this.tamanho / 2, this.y - this.tamanho, this.tamanho, this.tamanho * 2);
    fill(0);
    ellipse(this.x, this.y - this.tamanho * 1.2, this.tamanho * 0.8);
  }

  atingiuCampo() {
    return dist(this.x, this.y, width / 2, height * 0.3) < 40;
  }

  receberDano(valor = 1) {
    this.vida -= valor;
  }

  estaMorto() {
    return this.vida <= 0;
  }

  congelar() {
    this.congelado = true;
    this.congelamentoTimer = 60;
  }
}

// DEFESA BASE
class Defesa {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vida = 60;
  }

  atualizar() {
    this.vida--;
  }
}

// ESPÍRITO VERDE
class EspiritoVerde extends Defesa {
  constructor(x, y) {
    super(x, y);
    this.raio = 20;
  }

  mostrar() {
    fill(0, 255, 0, 150);
    ellipse(this.x, this.y, this.raio * 2 + sin(frameCount * 0.5) * 5);
  }

  atacar(inimigos) {
    for (let inimigo of inimigos) {
      if (dist(this.x, this.y, inimigo.x, inimigo.y) < this.raio + inimigo.tamanho / 2) {
        inimigo.receberDano();
      }
    }
  }
}

// ESPÍRITO DE GELO
class EspiritoGelo extends Defesa {
  constructor(x, y) {
    super(x, y);
    this.raio = 25;
  }

  mostrar() {
    fill(150, 200, 255, 180);
    ellipse(this.x, this.y, this.raio * 2 + cos(frameCount * 0.3) * 4);
  }

  atacar(inimigos) {
    for (let inimigo of inimigos) {
      if (dist(this.x, this.y, inimigo.x, inimigo.y) < this.raio + inimigo.tamanho / 2) {
        inimigo.receberDano(0.5);
        inimigo.congelar();
      }
    }
  }
}

// ANIMAL GUARDIÃO
class AnimalGuardiao extends Defesa {
  constructor(x, y) {
    super(x, y);
    this.raio = 35;
  }

  mostrar() {
    fill(255, 165, 0, 150);
    ellipse(this.x, this.y, this.raio * 2 + random(-2, 2));
  }

  atacar(inimigos) {
    for (let inimigo of inimigos) {
      if (dist(this.x, this.y, inimigo.x, inimigo.y) < this.raio + inimigo.tamanho / 2) {
        inimigo.receberDano(2);
      }
    }
  }
}

// TORRE
class Torre extends Defesa {
  constructor(x, y) {
    super(x, y);
    this.cooldown = 0;
  }

  mostrar() {
    fill(200);
    rect(this.x - 5, this.y - 20, 10, 40);
    fill(100);
    ellipse(this.x, this.y - 25, 15);
  }

  atacar(inimigos) {
    if (this.cooldown <= 0) {
      let alvo = null;
      let minDist = 150;
      for (let inimigo of inimigos) {
        let d = dist(this.x, this.y, inimigo.x, inimigo.y);
        if (d < minDist) {
          minDist = d;
          alvo = inimigo;
        }
      }
      if (alvo) {
        stroke(255, 0, 0);
        line(this.x, this.y, alvo.x, alvo.y);
        noStroke();
        alvo.receberDano();
        this.cooldown = 30;
      }
    } else {
      this.cooldown--;
    }
  }
}
