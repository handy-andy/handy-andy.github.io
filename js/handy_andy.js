let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: "arcade",
        arcade: {
            gravity: {y: 300},
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game = new Phaser.Game(config);

const KEY_HANDY_ANDY = "handy-andy";
const KEY_PLATFORM_GROUND = "ground-platform";
const KEY_PLATFORM_FLOATING = "floating-platform";
const KEY_SKY = "sky";
const KEY_CHICKEN_BUCKET = "chicken-bucket";
const KEY_TOMATO = "tomato";
const KEY_LCC = "lcc";
const KEY_CHICKEN_POWER = "chicken-power";
const KEY_LEFT = "left";
const KEY_TURN = "turn";
const KEY_RIGHT = "right";
const KEY_LCC_LEFT = "lcc-left";
const KEY_LCC_TURN = "lcc-turn";
const KEY_LCC_RIGHT = "lcc-right";

const PLATFORM_GROUND_LEFT_X = 400;
const PLATFORM_GROUND_Y = 568;
const PLATFORM_GROUND_RIGHT_X = 800;
const PLATFORM_FLOATING_1_LEFT_X = 600;
const PLATFORM_FLOATING_1_Y = 400;
const PLATFORM_FLOATING_1_RIGHT_X = 800;
const PLATFORM_FLOATING_2_LEFT_X = 50;
const PLATFORM_FLOATING_2_Y = 250;
const PLATFORM_FLOATING_2_RIGHT_X = 450;
const PLATFORM_FLOATING_3_LEFT_X = 750;
const PLATFORM_FLOATING_3_Y = 220;
const PLATFORM_FLOATING_3_RIGHT_X = 800;

const MIN_BUCKETS = 1;
const MAX_BUCKETS = 8;


function preload() {
    this.load.image(KEY_SKY, "assets/sky.png");
    this.load.image(KEY_PLATFORM_GROUND, "assets/ground-platform.png");      // 802 x 72
    this.load.image(KEY_PLATFORM_FLOATING, "assets/floating-platform.png");  // 400 x 32
    this.load.image(KEY_CHICKEN_BUCKET, "assets/chicken-bucket.png");
    this.load.image(KEY_TOMATO, "assets/tomato.png");
    this.load.image(KEY_LCC, "assets/lcc.png");
    this.load.image(KEY_CHICKEN_POWER, "assets/chicken-power.png");
    this.load.spritesheet(KEY_HANDY_ANDY, "assets/handy-andy-with-lcc-final.png", {frameWidth: 48, frameHeight: 74});
}

function create() {
    this.add.image(400, 300, KEY_SKY);

    this.platforms = createPlatforms(this);
    this.platformLookup = createPlatformLookup();
    this.lcc = createDisabledLcc(this);
    this.handyAndy = createHandyAndy(this);
    createChickenBuckets(this);
    this.chickenPowerImage = createHiddenChickenPowerImage(this);
    this.tomatoes = this.physics.add.group();

    this.lccTimedEvent = this.time.addEvent({delay: 2000, callback: onLccEvent, callbackScope: this, loop: true});
    this.cursors = this.input.keyboard.createCursorKeys();

    this.physics.add.collider(this.lcc, this.platforms);
    this.physics.add.collider(this.tomatoes, this.platforms);
    this.physics.add.collider(this.handyAndy, this.tomatoes, hitTomato, null, this);
    this.physics.add.overlap(this.handyAndy, this.lcc, visitLcc, null, this);

    this.score = 0;
    this.chickenPower = 0;
    this.scoreText = this.add.text(16, 16, "Score: " + this.score, {fontSize: "32px", fill: "#000"});
}

function createPlatforms(scope) {
    let platforms = scope.physics.add.staticGroup();
    platforms.create(PLATFORM_GROUND_LEFT_X, PLATFORM_GROUND_Y, KEY_PLATFORM_GROUND);
    platforms.create(PLATFORM_FLOATING_1_LEFT_X, PLATFORM_FLOATING_1_Y, KEY_PLATFORM_FLOATING);
    platforms.create(PLATFORM_FLOATING_2_LEFT_X, PLATFORM_FLOATING_2_Y, KEY_PLATFORM_FLOATING);
    platforms.create(PLATFORM_FLOATING_3_LEFT_X, PLATFORM_FLOATING_3_Y, KEY_PLATFORM_FLOATING);

    return platforms;
}

function createPlatformLookup() {
    let platformLookup = [];
    platformLookup.push({leftX: PLATFORM_GROUND_LEFT_X, rightX: PLATFORM_GROUND_RIGHT_X, y: PLATFORM_GROUND_Y});
    platformLookup.push({
        leftX: PLATFORM_FLOATING_1_LEFT_X,
        rightX: PLATFORM_FLOATING_1_RIGHT_X,
        y: PLATFORM_FLOATING_1_Y
    });
    platformLookup.push({
        leftX: PLATFORM_FLOATING_2_LEFT_X,
        rightX: PLATFORM_FLOATING_2_RIGHT_X,
        y: PLATFORM_FLOATING_2_Y
    });
    platformLookup.push({
        leftX: PLATFORM_FLOATING_3_LEFT_X,
        rightX: PLATFORM_FLOATING_3_RIGHT_X,
        y: PLATFORM_FLOATING_3_Y
    });

    return platformLookup;
}

function createDisabledLcc(scope) {
    let lcc = scope.physics.add.sprite(-1000, -1000, KEY_LCC);
    lcc.disableBody(true, true);

    return lcc;
}

function createHandyAndy(scope) {
    scope.lccVisited = false;

    let handyAndy = scope.physics.add.sprite(100, 450, KEY_HANDY_ANDY);
    handyAndy.setBounce(0.2);
    handyAndy.setCollideWorldBounds(true);
    scope.physics.add.collider(handyAndy, scope.platforms);

    scope.anims.create({
        key: KEY_LEFT,
        frames: scope.anims.generateFrameNumbers(KEY_HANDY_ANDY, {start: 0, end: 3}),
        frameRate: 10,
        repeat: -1
    });
    scope.anims.create({
        key: KEY_TURN,
        frames: [{key: KEY_HANDY_ANDY, frame: 4}],
        frameRate: 20
    });
    scope.anims.create({
        key: KEY_RIGHT,
        frames: scope.anims.generateFrameNumbers(KEY_HANDY_ANDY, {start: 5, end: 8}),
        frameRate: 10,
        repeat: -1
    });
    scope.anims.create({
        key: KEY_LCC_LEFT,
        frames: scope.anims.generateFrameNumbers(KEY_HANDY_ANDY, {start: 9, end: 12}),
        frameRate: 10,
        repeat: -1
    });
    scope.anims.create({
        key: KEY_LCC_TURN,
        frames: [{key: KEY_HANDY_ANDY, frame: 13}],
        frameRate: 20
    });
    scope.anims.create({
        key: KEY_LCC_RIGHT,
        frames: scope.anims.generateFrameNumbers(KEY_HANDY_ANDY, {start: 14, end: 17}),
        frameRate: 10,
        repeat: -1
    });

    return handyAndy;
}

function createChickenBuckets(scope) {
    scope.chickenBuckets = scope.physics.add.group();
    let randomNumberOfChickenBuckets = getRandomInt(MIN_BUCKETS, MAX_BUCKETS);

    for (i = 0; i < randomNumberOfChickenBuckets; i++) {
        let chickenBucket = scope.chickenBuckets.create(getRandomInt(0, 800), 0, KEY_CHICKEN_BUCKET);
        chickenBucket.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    }

    scope.physics.add.collider(scope.chickenBuckets, scope.platforms);
    scope.physics.add.overlap(scope.handyAndy, scope.chickenBuckets, collectChickenBucket, null, scope);
}

function createHiddenChickenPowerImage(scope) {
    let chickenPowerImage = scope.add.image(800 - 24, 600 - 32, KEY_CHICKEN_POWER);
    chickenPowerImage.visible = false;

    return chickenPowerImage;
}

function onLccEvent() {
    // Random chance of an LCC appearing if it isn't already visible or visited
    if (!this.lcc.visible && !this.lccVisited && getRandomInt(1, 100) % 3 === 0) {
        let selectedPlatformIndex = getRandomInt(1, 100) % 4;
        let x = getRandomInt(this.platformLookup[selectedPlatformIndex].leftX, this.platformLookup[selectedPlatformIndex].rightX);

        this.lcc.enableBody(true, x, this.platformLookup[selectedPlatformIndex].y - 154, true, true);
    }
}

function hitTomato(player, tomato) {
    this.physics.pause();
    this.lccTimedEvent.remove(false);

    player.setTint(0xff0000);
    player.anims.play(KEY_TURN);

    this.add.text(800 / 5, 600 / 2, "DEATH BY TOMATO", {
        font: "bold 50px Arial",
        fill: "#000",
        boundsAlignH: "center",
        boundsAlignV: "middle"
    });

    this.add.text(800 / 2, (600 / 3) * 2, "Click to play again", {
        font: "bold 30px Arial",
        fill: "#000",
        boundsAlignH: "center",
        boundsAlignV: "middle"
    });

    this.input.on("pointerdown", function (pointer) {
        this.registry.destroy();
        this.events.off();﻿
        this.scene.restart();
        this.lccVisited = false;
    }, this);
}

function visitLcc(player, lcc) {
    lcc.disableBody(true, true);
    this.lccVisited = true;
    this.chickenPower = 0;
    this.chickenPowerImage.visible = false;
}

function update() {
    const HORIZONTAL_VELOCITY = 160;
    const VERTICAL_VELOCITY = -330;
    const LCC_FACTOR = 2;

    if (this.cursors.left.isDown) {
        if (this.lccVisited) {
            this.handyAndy.setVelocityX(-1 * (HORIZONTAL_VELOCITY / LCC_FACTOR));
            this.handyAndy.anims.play(KEY_LCC_LEFT, true);
        }
        else {
            this.handyAndy.setVelocityX(-1 * HORIZONTAL_VELOCITY);
            this.handyAndy.anims.play(KEY_LEFT, true);
        }
    }
    else if (this.cursors.right.isDown) {
        if (this.lccVisited) {
            this.handyAndy.setVelocityX(HORIZONTAL_VELOCITY / LCC_FACTOR);
            this.handyAndy.anims.play(KEY_LCC_RIGHT, true);
        }
        else {
            this.handyAndy.setVelocityX(HORIZONTAL_VELOCITY);
            this.handyAndy.anims.play(KEY_RIGHT, true);
        }
    }
    else {
        if (this.lccVisited) {
            this.handyAndy.setVelocityX(0);
            this.handyAndy.anims.play(KEY_LCC_TURN);
        }
        else {
            this.handyAndy.setVelocityX(0);
            this.handyAndy.anims.play(KEY_TURN);
        }
    }

    if (this.cursors.up.isDown && this.handyAndy.body.touching.down) {
        if (this.lccVisited) {
            this.handyAndy.setVelocityY((VERTICAL_VELOCITY / 2) - 200);
        }
        else {
            this.handyAndy.setVelocityY(VERTICAL_VELOCITY);
        }
    }
}

function collectChickenBucket(player, chickenBucket) {
    chickenBucket.disableBody(true, true);

    // Update the score
    this.score += 10;
    this.scoreText.setText("Score: " + this.score);

    // Bump chicken power
    this.chickenPower++;

    if (!this.lccVisited) {
        this.chickenPowerImage.visible = true;
    }

    if (this.chickenBuckets.countActive(true) === 0) {
        // Clear LCC and effect if present
        this.lcc.disableBody(true, true);
        this.lccVisited = false;
        this.chickenPowerImage.visible = true;

        // A new batch of chicken buckets to collect
        createChickenBuckets(this);

        // Add a tomato
        let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        let tomato = this.tomatoes.create(x, 16, KEY_TOMATO);
        tomato.setBounce(1);
        tomato.setCollideWorldBounds(true);
        tomato.setVelocity(Phaser.Math.Between(-200, 200), 20);
        tomato.allowGravity = false;
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}
