const config = {
type: Phaser.AUTO,
width: 800,
height: 500,
physics:{
default:"arcade",
arcade:{gravity:{y:0},debug:false}
},
scene:{preload:preload,create:create,update:update}
};

let player;
let obstacles;

let lanes=[320,400,480];
let currentLane=1;

let speed=200;
let spawnRate=1500;

let keys;

let distance=0;
let distanceText;
let difficultyLevel=1;

let gameOver=false;
let restartKey;
let gameOverText;

let roadLines=[];
let trees=[];
let buildings=[];

let gameStarted=false;
let startText;
let titleText;

let leftButton;
let rightButton;

let leftSignal;
let rightSignal;

new Phaser.Game(config);

function preload(){

this.load.image("player","https://labs.phaser.io/assets/sprites/car90.png");
this.load.image("car","https://labs.phaser.io/assets/sprites/car90.png");

}

function create(){

let g=this.add.graphics();

// sky
g.fillStyle(0x87ceeb,1);
g.fillRect(0,0,800,500);

// grass
g.fillStyle(0x2e8b57,1);
g.fillRect(0,0,250,500);
g.fillRect(550,0,250,500);

// road
g.fillStyle(0x2f2f2f,1);
g.fillRect(250,0,300,500);

// road lines
for(let i=0;i<10;i++){

let edgeL=this.add.rectangle(250,i*60,4,40,0xffffff);
let edgeR=this.add.rectangle(550,i*60,4,40,0xffffff);

roadLines.push(edgeL);
roadLines.push(edgeR);

}

// lane dividers
for(let i=0;i<10;i++){

let line1=this.add.rectangle(350,i*60,4,30,0xffffff);
let line2=this.add.rectangle(450,i*60,4,30,0xffffff);

roadLines.push(line1);
roadLines.push(line2);

}

// yellow center
for(let i=0;i<10;i++){

let center=this.add.rectangle(400,i*60,6,30,0xffff00);
roadLines.push(center);

}

// buildings
for(let i=0;i<4;i++){

let lb=this.add.rectangle(70,i*150,120,120,0x666666);
let rb=this.add.rectangle(730,i*150,120,120,0x666666);

buildings.push(lb);
buildings.push(rb);

}

// trees
for(let i=0;i<6;i++){

let lt=this.add.circle(180,i*100,20,0x0b6623);
let rt=this.add.circle(620,i*100,20,0x0b6623);

trees.push(lt);
trees.push(rt);

}

// player
player=this.physics.add.sprite(lanes[currentLane],420,"player");
player.setAngle(-90);
player.setCollideWorldBounds(true);

// player signals
leftSignal=this.add.circle(player.x-20,player.y,5,0xffaa00);
rightSignal=this.add.circle(player.x+20,player.y,5,0xffaa00);

leftSignal.setVisible(false);
rightSignal.setVisible(false);

// input
keys=this.input.keyboard.addKeys({left:'A',right:'D'});
restartKey=this.input.keyboard.addKey('R');

// obstacles
obstacles=this.physics.add.group();

this.physics.add.overlap(player,obstacles,crash,null,this);

// UI
distanceText=this.add.text(20,20,"Distance: 0m",{fontSize:"24px",fill:"#ffffff"});
distanceText.setVisible(false);

gameOverText=this.add.text(260,200,"GAME OVER\nPress R",{fontSize:"40px",fill:"#ff0000",align:"center"});
gameOverText.setVisible(false);

// title
titleText=this.add.text(260,120,"TRAFFIC RUNNER",{fontSize:"48px",fill:"#ffffff"});

// start button
startText=this.add.text(340,260,"START",{fontSize:"40px",fill:"#00ff00"}).setInteractive();
startText.on("pointerdown",()=>startGame(this));

// controls
createControls(this);

}

function startGame(scene){

gameStarted=true;

titleText.setVisible(false);
startText.setVisible(false);

distanceText.setVisible(true);

spawnTraffic(scene);

}

function update(){

if(!gameStarted) return;

if(gameOver){

if(Phaser.Input.Keyboard.JustDown(restartKey)){
location.reload();
}

return;

}

// distance
distance+=0.1*(speed/100);
distanceText.setText("Distance: "+Math.floor(distance)+"m");

// difficulty increase
if(distance>difficultyLevel*200){

difficultyLevel++;

speed+=40;
spawnRate*=0.9;

let flash=this.add.text(340,120,"SPEED UP!",{fontSize:"40px",fill:"#ffff00"});
this.time.delayedCall(800,()=>flash.destroy());

}

// move road
roadLines.forEach(l=>{
l.y+=speed*0.02;
if(l.y>520) l.y=-40;
});

// trees
trees.forEach(t=>{
t.y+=speed*0.02;
if(t.y>520) t.y=-20;
});

// buildings
buildings.forEach(b=>{
b.y+=speed*0.01;
if(b.y>600) b.y=-120;
});

// player signals follow
leftSignal.x=player.x-20;
leftSignal.y=player.y;

rightSignal.x=player.x+20;
rightSignal.y=player.y;

// player movement
if(Phaser.Input.Keyboard.JustDown(keys.left)){
moveLeft(this);
animateButton(leftButton);
}

if(Phaser.Input.Keyboard.JustDown(keys.right)){
moveRight(this);
animateButton(rightButton);
}

// traffic logic
obstacles.children.iterate(function(car){

if(!car) return;

// move forward
car.y += car.speed * 0.02;

// remove off screen
if(car.y > 560){
car.destroy();
return;
}

// lane change AI
if(car.changingLane) return;

if(Phaser.Math.Between(0,1000) < 3){

let laneIndex=lanes.indexOf(car.x);

let newLane=Phaser.Math.Clamp(
laneIndex + Phaser.Math.Between(-1,1),
0,
2
);

if(newLane===laneIndex) return;

car.changingLane=true;

// signal
let signalX=newLane>laneIndex?car.x+20:car.x-20;

let signal=car.scene.add.circle(signalX,car.y,5,0xffaa00);

// blink then move
car.scene.time.delayedCall(350,function(){

car.scene.tweens.add({
targets:car,
x:lanes[newLane],
duration:350,
onComplete:function(){

signal.destroy();
car.changingLane=false;

}
});

});

}

});

}

function spawnTraffic(scene){

if(gameOver) return;

let lane=Phaser.Math.Between(0,2);

let car=obstacles.create(lanes[lane],-60,"car");

car.setAngle(-90);
car.body.allowGravity=false;

// random colors
let colors=[0xff0000,0x00ff00,0x0000ff,0xffff00,0xff00ff,0x00ffff];
car.setTint(Phaser.Utils.Array.GetRandom(colors));

// random speed
car.speed=Phaser.Math.Between(80,180);

scene.time.delayedCall(spawnRate,spawnTraffic,[scene]);

}

function moveLeft(scene){

if(currentLane>0){

currentLane--;

blinkSignal(leftSignal);

scene.tweens.add({
targets:player,
x:lanes[currentLane],
duration:150
});

}

}

function moveRight(scene){

if(currentLane<2){

currentLane++;

blinkSignal(rightSignal);

scene.tweens.add({
targets:player,
x:lanes[currentLane],
duration:150
});

}

}

function crash(){

gameOver=true;

player.setTint(0xff0000);

player.scene.tweens.add({
targets:player,
angle:360,
duration:500
});

gameOverText.setVisible(true);

}

function createControls(scene){

leftButton=scene.add.rectangle(250,460,120,50,0x000000)
.setStrokeStyle(3,0xffffff)
.setInteractive();

scene.add.text(215,445,"<- A",{fontSize:"28px",fill:"#ffffff"});

leftButton.on("pointerdown",()=>{
moveLeft(scene);
animateButton(leftButton);
});

rightButton=scene.add.rectangle(500,460,120,50,0x000000)
.setStrokeStyle(3,0xffffff)
.setInteractive();

scene.add.text(465,445,"D ->",{fontSize:"28px",fill:"#ffffff"});

rightButton.on("pointerdown",()=>{
moveRight(scene);
animateButton(rightButton);
});

}

function animateButton(button){

button.setFillStyle(0xffff00);

button.scene.tweens.add({
targets:button,
scaleX:1.2,
scaleY:1.2,
yoyo:true,
duration:100,
onComplete:()=>button.setFillStyle(0x000000)
});

}

function blinkSignal(signal){

signal.setVisible(true);

signal.scene.time.delayedCall(300,()=>signal.setVisible(false));

}