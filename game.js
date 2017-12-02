var SQUIRREL_SPEED = 200;
var TREE_SPEED = 180;
var BULLET_SPEED = 300;
var BIRD_SPEED = 300;
var BIRD_HEALTH = 100;
var SAW_HEALTH = 250;
var SPAWN_TIME = 0.1;
var POWER_UP_TIME = 4;

var ASSET_VERSION = (new Date()).getTime();


var DEBUG = false;

var POWER_UP_TYPES = {
    LOLLI: 1,
    NUGGET: 2,
    RAINBOW: 3,
    BURGER: 4,
    EGG: 5,
};

var SQUIRREL_MODE = {
    NUTS: 1,
    GRENADES: 2,
    FLAMES: 3,
    RADIOACTIVE: 4
};

var BULLET_TYPES = {
    NUT: 1,
    GRENADE: 2,
    FLAMES: 3,
    CHILD: 4
};

var TEXT_COLOR = '#ffdd00';

var state = {
    preload: function() {
        this.load.spritesheet('squirrel', 'assets/squirrel-spritesheet.png?' + ASSET_VERSION, 48, 96);
        this.load.spritesheet('squirrel-weapons', 'assets/squirrel-weapons.png?'  + ASSET_VERSION, 48, 96);
        this.load.spritesheet('grenade', 'assets/grenade.png', 48, 48);
        this.load.spritesheet('bird', 'assets/bird.png', 48, 48);
        this.load.spritesheet('flame', 'assets/flames.png', 24, 36);
        this.load.spritesheet('child', 'assets/lilsquirrels.png', 32, 54);
        this.load.image('sky', 'assets/sky.png');
        this.load.image('clouds', 'assets/clouds.png');
        this.load.image('tree', 'assets/tree.png');
        this.load.image('nut', 'assets/nut.png');
        this.load.image('lolli', 'assets/lolli.png');
        this.load.image('rainbow', 'assets/rainbow.png');
        this.load.image('explosion', 'assets/explosion.png');
        this.load.image('nugget', 'assets/nugget.png');
        this.load.image('saw', 'assets/saw.png');
        this.load.image('egg', 'assets/egg.png');
        this.load.image('burger', 'assets/burger.png');
    },
    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.sky = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'sky');
        this.clouds = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'clouds');
        this.tree = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'tree');
        this.squirrel = this.add.sprite(this.world.width / 2, this.world.height - 150, 'squirrel');
        this.squirrel.animations.add('run', [0, 1, 2, 3, 2, 1], 20, true);
        this.squirrel.animations.add('run-pink', [4, 5, 6, 7, 6, 5], 20, true);
        this.squirrel.animations.add('dead', [8, 9, 10, 11], 8, true);
        this.squirrel.animations.play('run');
        this.squirrel.data.mode = SQUIRREL_MODE.NUTS;
        this.game.physics.enable(this.squirrel);
        this.squirrel.body.setSize(34, 64, 8, 0);

        this.squirrelWeapons = this.add.sprite(this.squirrel.x, this.squirrel.y, 'squirrel-weapons');
        this.squirrelWeapons.animations.add('grenade', [1], 1, false);
        this.squirrelWeapons.animations.add('flames', [0], 1, false);
        this.squirrelWeapons.animations.add('child', [2], 1, false);
        this.squirrelWeapons.animations.add('nuts', [3], 1, false);
        this.squirrelWeapons.animations.add('none', [4], 1, false);
        this.squirrelWeapons.animations.play('nuts');

        this.powerups = this.add.group();

        this.enemies = this.add.group();
        this.enemies.enableBody = true;
        this.bullets = this.add.group();
        this.bullets.enableBody = true;
        this.hints = this.add.group();

        this.scoreText = this.add.text(10, 10, '', {fill: TEXT_COLOR});

        this.score = 0;
        this.gameOver = false;
        this.birdFrequency = 30;
        this.sawFrequency = 3;
        this.shootFrequency = 0.4;

        this.cursors = game.input.keyboard.createCursorKeys();

        this.time.events.repeat(Phaser.Timer.SECOND * SPAWN_TIME, Infinity, this.spawnSomething, this);
        this.createShootTimer();
    },
    update: function() {
        this.squirrel.body.velocity.x = 0;
        if (this.gameOver) {
            return;
        }

        this.scoreText.text = 'Score: ' + this.score;
        if (this.cursors.left.isDown && this.squirrel.body.position.x > 0) {
            this.squirrel.body.velocity.x = -SQUIRREL_SPEED;
        }
        if (this.cursors.right.isDown
            && this.squirrel.body.position.x < this.world.width - this.cache.getImage('squirrel').width
        ) {
            this.squirrel.body.velocity.x = SQUIRREL_SPEED;
        }

        this.sky.tilePosition.y += this.time.physicsElapsed * TREE_SPEED * 0.3;
        this.clouds.tilePosition.y += this.time.physicsElapsed * TREE_SPEED * 0.6;
        this.tree.tilePosition.y += this.time.physicsElapsed * TREE_SPEED;

        this.physics.arcade.overlap(this.bullets, this.enemies, this.bulletCollisionHandler, null, this);
        this.physics.arcade.overlap(this.squirrel, this.powerups, this.collectPowerUp, null, this);
        this.physics.arcade.overlap(this.squirrel, this.enemies, this.squirrelCollisionHandler, null, this);
        if(this.squirrel.body.left < 25 || this.squirrel.body.right > this.game.width - 25)
            this.squirrelFallOfTheTree();

        this.bullets.forEachAlive(function(bullet) {
            switch(bullet.data.type) {
                case BULLET_TYPES.FLAMES:
                    if(bullet.body.top < 200)
                        bullet.kill();
                break;
            }
        }.bind(this));
    },
    preRender: function() {
        this.squirrelWeapons.x = this.squirrel.x;
        this.squirrelWeapons.y = this.squirrel.y;
    },
    spawnSomething: function() {
        if (this.gameOver) {
            return;
        }
        var spawnies = [
            {
                func: this.spawnLolli.bind(this),
                weight: 5
            },
            {
                func: this.spawnNugget.bind(this),
                weight: 5
            },
            {
                func: this.spawnBird.bind(this),
                weight: this.birdFrequency,
            },
            {
                func: this.spawnSaw.bind(this),
                weight: this.sawFrequency,
            },
            {
                func: this.spawnRainbow.bind(this),
                weight: 3
            },
            {
                func: this.spawnBurger.bind(this),
                weight: 5,
            },
            {
                func: this.spawnEgg.bind(this),
                weight: 15,
            },
            {
                func: function() {},
                weight: 1000,
            },
        ];
        var max = 0;
        for(var i = 0; i < spawnies.length; i++) max += spawnies[i].weight;
        var random = Math.floor(Math.random() * max);
        var steps = 0;
        for(var i = 0; i < spawnies.length; i++) {
            steps += spawnies[i].weight;
            if(random < steps) {
                spawnies[i].func.call();
                return;
            }
        }
    },
    spawnLolli: function() {
        this.createPowerUp('lolli', POWER_UP_TYPES.LOLLI, TREE_SPEED);
    },
    spawnNugget: function() {
        this.createPowerUp('nugget', POWER_UP_TYPES.NUGGET, TREE_SPEED);
    },
    spawnRainbow: function() {
        this.createPowerUp('rainbow', POWER_UP_TYPES.RAINBOW, TREE_SPEED);
    },      
    spawnBurger: function() {
        this.createPowerUp('burger', POWER_UP_TYPES.BURGER, TREE_SPEED);
    },
    spawnEgg: function() {
        this.createPowerUp('egg', POWER_UP_TYPES.EGG, TREE_SPEED);
    },
    createPowerUp: function(image, type, speed) {
        var powerup = this.powerups.create(
            (this.game.width - this.cache.getImage(image).width - 40) * Math.random() + 20,
            -this.cache.getImage(image).height,
            image
        );
        this.game.physics.arcade.enable(powerup);
        powerup.body.velocity.y = speed;
        powerup.data.type = type;
        return powerup;
    },
    spawnBird: function() {
        var bird = this.enemies.create(
            (this.game.width - this.cache.getImage('bird').width) * Math.random(),
            -this.cache.getImage('bird').height,
            'bird'
        );

        bird.body.checkCollision.down = true;
        bird.body.setSize(24, 32, 11, 11);
        bird.body.velocity.y = BIRD_SPEED;
        bird.health = BIRD_HEALTH;
        bird.score = 1000;
        
        bird.animations.add('fly', [0, 1, 2, 3, 2, 1], 20, true);
        bird.animations.play('fly');
    },
    spawnSaw: function() {
        var saw = this.enemies.create(
            (this.game.width - this.cache.getImage('saw').width),
            -this.cache.getImage('saw').height,
            'saw'
        );
        
        saw.body.checkCollision.down = true;
        saw.body.setSize(165, 37, 0, 2);
        saw.body.velocity.y = TREE_SPEED;
        saw.body.velocity.x = 20;
        saw.health = SAW_HEALTH;
        saw.score = 3000;
    },
    shoot: function() {
        if (this.gameOver) {
            return;
        }

        switch(this.squirrel.data.mode) {
            case SQUIRREL_MODE.GRENADE:
                this.spawnGrenade();
            break;
            case SQUIRREL_MODE.FLAMES:
                this.spawnFlame();
            break;
            case SQUIRREL_MODE.RADIOACTIVE:
                this.spawnChild();
            break;
            case SQUIRREL_MODE.NUTS:
            default:
                this.spawnNut();
            break;
        }
    },
    spawnChild: function() {
        var child = this.createBullet('child', BULLET_TYPES.CHILD, BULLET_SPEED);
        child.animations.add('tongue', [0, 1, 2, 3, 2, 1], 20, true);
        child.animations.play('tongue');
    },
    spawnGrenade: function() {
        var grenade = this.createBullet('grenade', BULLET_TYPES.GRENADE, BULLET_SPEED);
        grenade.animations.add('circle', [0, 1, 2, 3, 4, 5, 6], 20, true);
        grenade.animations.play('circle');
    },
    spawnFlame: function() {
        var flame = this.createBullet('flame', BULLET_TYPES.FLAMES, BULLET_SPEED, 25);
        flame.animations.add('circle', [0, 1, 2, 3, 2, 1], 20, true);
        flame.animations.play('circle');
    },
    spawnNut: function() {
        this.createBullet('nut', BULLET_TYPES.NUT, BULLET_SPEED);
    },
    createBullet: function(image, type, speed, xOffset) {
        if(!xOffset) xOffset = 0;
        var bullet = this.bullets.create(
            this.squirrel.body.position.x + xOffset,
            this.squirrel.position.y,
            image
        );

        bullet.body.checkCollision.up = true;
        bullet.body.velocity.y = -speed;
        bullet.killOutOfBounds = true;
        bullet.data.type = type;
        bullet.y -= bullet.body.height;

        return bullet;
    },
    bulletCollisionHandler: function(bullet, enemy) {
        bullet.kill();
        switch(bullet.data.type) {
            case BULLET_TYPES.NUT: 
                enemy.health -= 34;
            break;
            case BULLET_TYPES.GRENADE:
                enemy.health -= 100;
            break;
            case BULLET_TYPES.FLAMES:
                enemy.health -= 400;
            break;
            case BULLET_TYPES.CHILD:
                enemy.health -= 15;
            break;
        }

        this.score += 10;

        if(enemy.health <= 0) {
            enemy.kill();
            var explosion = this.add.sprite(
                enemy.body.position.x - this.cache.getImage('explosion').width / 2,
                enemy.body.position.y - this.cache.getImage('explosion').height / 2,
                'explosion'
            );
            this.game.camera.shake(0.05, 500);
            this.score += enemy.score;
            this.birdFrequency += 10;
            this.sawFrequency += 1;

            this.time.events.add(Phaser.Timer.SECOND * 0.5, function() {
                explosion.kill();
            });            
        }
    },
    collectPowerUp: function(squirrel, powerUp) {
        powerUp.kill();
        switch(powerUp.data.type) {
            case POWER_UP_TYPES.LOLLI:
                squirrel.data.mode = SQUIRREL_MODE.GRENADE;
                this.showHint(squirrel, 'GRENADE LOLLI');
                this.squirrelWeapons.animations.play('grenade');
                this.game.time.events.add(Phaser.Timer.SECOND * POWER_UP_TIME, this.normalizeMode, this);
            break;
            case POWER_UP_TYPES.NUGGET:
                this.showHint(squirrel, 'I LUVE NUGGETS');
                this.score += 5000;
            break;
            case POWER_UP_TYPES.RAINBOW:
                squirrel.data.mode = SQUIRREL_MODE.FLAMES;
                this.showHint(squirrel, 'I\'M ON FIRE, BIAATCH');
                this.squirrel.animations.play('run-pink');
                this.squirrelWeapons.animations.play('flames');
                this.game.time.events.add(Phaser.Timer.SECOND * POWER_UP_TIME, this.normalizeMode, this);
            break;
            case POWER_UP_TYPES.BURGER:
                this.shootFrequency *= 0.9;
                this.createShootTimer();
            break;
            case POWER_UP_TYPES.EGG:
                squirrel.data.mode = SQUIRREL_MODE.RADIOACTIVE;
                this.showHint(squirrel, 'SPREADING THE RADIOACTIVE PROGENY');
                this.squirrelWeapons.animations.play('child');
                //this.squirrelWeapons.animations.play('flames');
                this.game.time.events.add(Phaser.Timer.SECOND * POWER_UP_TIME, this.normalizeMode, this);            
            break;
        }
    },
    normalizeMode: function() {
        this.squirrel.data.mode = SQUIRREL_MODE.NUTS;
        this.squirrelWeapons.animations.play('nuts');
        this.squirrel.animations.play('run');
    },
    showHint: function(focusOn, text) {
        var hint = this.game.add.text(
            focusOn.x,
            focusOn.y,
            text,
            {
                fill: '#ff0000',
                align: 'center'
            }
        );
        hint.anchor.setTo(0.5, 0.5);
        hint.fontSize = 20;

        var move = this.game.add.tween(hint);
        move.to({ y: hint.y - 100, x: hint.x - 100 * Math.random() + 50}, 1000);
        move.onComplete.add(function() { hint.kill() }, this);
        move.start();

    },
    squirrelCollisionHandler: function(squirrel) {
        this.gameOver = true;
        this.add.text(10, this.world.height / 2, 'Looooooser', {fill: TEXT_COLOR});
        this.squirrel.animations.play('dead');
        this.squirrelWeapons.animations.play('none');
    },
    squirrelFallOfTheTree: function() {
        this.gameOver = true;
        this.add.text(10, this.world.height / 2, 'You fell of the tree.\nLOOOOL\nU suck', {fill: TEXT_COLOR, align: 'center'});
        this.squirrel.kill();
        this.squirrelWeapons.animations.play('none');
    },
    render: function() {
        if(DEBUG) {
            this.enemies.forEachAlive(function(enemy) { 
                this.game.debug.body(enemy);
            }.bind(this));
            this.game.debug.body(this.squirrel);
        }
    },
    createShootTimer: function() {
        if (this.shootTimer) {
            this.time.events.remove(this.shootTimer);
        }
        this.shootTimer = this.time.events.repeat(Phaser.Timer.SECOND * this.shootFrequency, Infinity, this.shoot, this);
    },
};

var game = new Phaser.Game(
    320,
    680,
    Phaser.CANVAS,
    '', 
    state
);
