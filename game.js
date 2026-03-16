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

let highScore=localStorage.getItem("trafficHighScore")||0;
let highScoreText;

let gameOver=false;

let restartButton;
let restartLabel;

let playButton;
let playLabel;

let leftButton;
let rightButton;

let roadLines=[];
let trees=[];
let buildings=[];

let leftSignal;
let rightSignal;

let gameStarted=false;

let sceneRef;

new Phaser.Game(config);

function preload(){

this.load.image("player","https://labs.phaser.io/assets/sprites/car90.png");
this.load.image("car","https://labs.phaser.io/assets/sprites/car90.png");

}

function create(){

sceneRef=this;

let g=this.add.graphics();

g.fillStyle(0x87ceeb,1);
g.fillRect(0,0,800,500);

g.fillStyle(0x2e8b57,1);
g.fillRect(0,0,250,500);
g.fillRect(550,0,250,500);

g.fillStyle(0x2f2f2f,1);
g.fillRect(250,0,300,500);

for(let i=0;i<10;i++){

let edgeL=this.add.rectangle(250,i*60,4,40,0xffffff);
let edgeR=this.add.rectangle(550,i*60,4,40,0xffffff);

roadLines.push(edgeL);
roadLines.push(edgeR);

}

for(let i=0;i<10;i++){

let line1=this.add.rectangle(350,i*60,4,30,0xffffff);
let line2=this.add.rectangle(450,i*60,4,30,0xffffff);

roadLines.push(line1);
roadLines.push(line2);

}

for(let i=0;i<10;i++){

let center=this.add.rectangle(400,i*60,6,30,0xffff00);
roadLines.push(center);

}

for(let i=0;i<4;i++){

let lb=this.add.rectangle(70,i*150,120,120,0x666666);
let rb=this.add.rectangle(730,i*150,120,120,0x666666);

buildings.push(lb);
buildings.push(rb);

}

for(let i=0;i<6;i++){

let lt=this.add.circle(180,i*100,20,0x0b6623);
let rt=this.add.circle(620,i*100,20,0x0b6623);

trees.push(lt);
trees.push(rt);

}

player=this.physics.add.sprite(lanes[currentLane],420,"player");
player.setAngle(-90);

leftSignal=this.add.circle(player.x-20,player.y,5,0xffaa00).setVisible(false);
rightSignal=this.add.circle(player.x+20,player.y,5,0xffaa00).setVisible(false);

keys=this.input.keyboard.addKeys({left:'A',right:'D'});

obstacles=this.physics.add.group();

this.physics.add.overlap(player,obstacles,crash,null,this);

distanceText=this.add.text(20,20,"Distance: 0m",{fontSize:"24px",fill:"#ffffff"}).setVisible(false);

highScoreText=this.add.text(20,50,"High Score: "+highScore,{fontSize:"20px",fill:"#ffff00"}).setVisible(false);

playButton=this.add.rectangle(400,260,200,60,0x000000).setStrokeStyle(3,0xffffff).setInteractive();
playLabel=this.add.text(360,240,"PLAY",{fontSize:"36px",fill:"#ffffff"});

playButton.on("pointerdown",()=>startGame(this));

restartButton=this.add.rectangle(400,320,200,60,0x000000).setStrokeStyle(3,0xffffff).setInteractive().setVisible(false);
restartLabel=this.add.text(340,300,"RESTART",{fontSize:"32px",fill:"#ffffff"}).setVisible(false);

restartButton.on("pointerdown",()=>location.reload());

createControls(this);

}

function startGame(scene){

gameStarted=true;

playButton.setVisible(false);
playLabel.setVisible(false);

distanceText.setVisible(true);
highScoreText.setVisible(true);

spawnTraffic(scene);

}

function update(){

if(!gameStarted || gameOver) return;

distance+=0.1*(speed/100);
distanceText.setText("Distance: "+Math.floor(distance)+"m");

if(distance>difficultyLevel*200){

difficultyLevel++;

speed+=40;
spawnRate*=0.9;

let flash=sceneRef.add.text(330,120,"SPEED UP!",{fontSize:"40px",fill:"#ffff00"});

sceneRef.time.delayedCall(900,()=>flash.destroy());

}

roadLines.forEach(l=>{
l.y+=speed*0.02;
if(l.y>520) l.y=-40;
});

trees.forEach(t=>{
t.y+=speed*0.02;
if(t.y>520) t.y=-20;
});

buildings.forEach(b=>{
b.y+=speed*0.01;
if(b.y>600) b.y=-120;
});

leftSignal.x=player.x-20;
rightSignal.x=player.x+20;

leftSignal.y=player.y;
rightSignal.y=player.y;

if(Phaser.Input.Keyboard.JustDown(keys.left)){
moveLeft();
animateButton(leftButton);
}

if(Phaser.Input.Keyboard.JustDown(keys.right)){
moveRight();
animateButton(rightButton);
}

obstacles.children.iterate(function(car){

if(!car) return;

car.y+=car.speed*0.02;

if(car.y>560){
car.destroy();
return;
}

if(car.changingLane) return;

if(Phaser.Math.Between(0,1000)<3){

let laneIndex=lanes.indexOf(car.x);

let newLane=Phaser.Math.Clamp(
laneIndex+Phaser.Math.Between(-1,1),
0,
2
);

if(newLane===laneIndex) return;

car.changingLane=true;

let signalX=newLane>laneIndex?car.x+20:car.x-20;

let signal=sceneRef.add.circle(signalX,car.y,5,0xffaa00);

sceneRef.time.delayedCall(400,function(){

sceneRef.tweens.add({
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

let colors=[0xff0000,0x00ff00,0x0000ff,0xffff00,0xff00ff];

car.setTint(Phaser.Utils.Array.GetRandom(colors));

car.speed=Phaser.Math.Between(80,180);

scene.time.delayedCall(spawnRate,spawnTraffic,[scene]);

}

function moveLeft(){

if(currentLane>0){

currentLane--;

blink(leftSignal);

sceneRef.tweens.add({
targets:player,
x:lanes[currentLane],
duration:150
});

}

}

function moveRight(){

if(currentLane<2){

currentLane++;

blink(rightSignal);

sceneRef.tweens.add({
targets:player,
x:lanes[currentLane],
duration:150
});

}

}

function blink(signal){

signal.setVisible(true);

sceneRef.time.delayedCall(300,()=>signal.setVisible(false));

}

function crash(){

gameOver=true;

let score=Math.floor(distance);

if(score>highScore){

highScore=score;
localStorage.setItem("trafficHighScore",highScore);

}

sceneRef.add.text(300,180,"GAME OVER",{fontSize:"40px",fill:"#ff0000"});
sceneRef.add.text(300,230,"Score: "+score,{fontSize:"28px",fill:"#ffffff"});
sceneRef.add.text(300,270,"High Score: "+highScore,{fontSize:"28px",fill:"#ffff00"});

restartButton.setVisible(true);
restartLabel.setVisible(true);

}

function createControls(scene){

leftButton=scene.add.rectangle(250,460,120,50,0x000000)
.setStrokeStyle(3,0xffffff)
.setInteractive();

scene.add.text(215,445,"<-A",{fontSize:"28px",fill:"#ffffff"});

leftButton.on("pointerdown",()=>{
moveLeft();
animateButton(leftButton);
});

rightButton=scene.add.rectangle(500,460,120,50,0x000000)
.setStrokeStyle(3,0xffffff)
.setInteractive();

scene.add.text(465,445,"D->",{fontSize:"28px",fill:"#ffffff"});

rightButton.on("pointerdown",()=>{
moveRight();
animateButton(rightButton);
});

}

function animateButton(button){

button.setFillStyle(0xffff00);

sceneRef.tweens.add({
targets:button,
scaleX:1.2,
scaleY:1.2,
yoyo:true,
duration:100,
onComplete:()=>button.setFillStyle(0x000000)
});

}
