var SQUIRREL_SPEED = 200;
var TREE_SPEED = 180;
var BULLET_SPEED = 300;
var BIRD_SPEED = 300;
var BIRD_HEALTH = 100;
var NUT_TIME = 0.3;
var SAW_HEALTH = 250;
var SPAWN_TIME = 0.1;
var POWER_UP_TIME = 4;

var DEBUG = false;

var POWER_UP_TYPES = {
    LOLLI: 1,
    NUGGET: 2
};

var SQUIRREL_MODE = {
    NUTS: 1,
    GRENADES: 2
};

var BULLET_TYPES = {
    NUT: 1,
    GRENADE: 2
};

var TEXT_COLOR = '#ffdd00';

var state = {
    preload: function() {
        this.load.spritesheet('squirrel', 'assets/squirrel-spritesheet.png', 48, 96);
        this.load.spritesheet('grenade', 'assets/grenade.png', 48, 48);
        this.load.image('tree', 'assets/tree.png');
        this.load.image('nut', 'assets/nut.png');
        this.load.spritesheet('bird', 'assets/bird.png', 48, 48);
        this.load.image('lolli', 'assets/lolli.png');
        this.load.image('explosion', 'assets/explosion.png');
        this.load.image('nugget', 'assets/nugget.png');
        this.load.image('saw', 'assets/saw.png');
    },
    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        this.tree = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'tree');
        this.squirrel = this.add.sprite(this.world.width / 2, this.world.height - 150, 'squirrel');
        this.squirrel.animations.add('run', [0, 1, 2, 3, 2, 1], 20, true);
        this.squirrel.animations.play('run');
        this.squirrel.data.mode = SQUIRREL_MODE.NUTS;
        this.game.physics.enable(this.squirrel);
        this.squirrel.body.setSize(34, 64, 8, 0);

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
        this.sawFrequency = 5;

        this.cursors = game.input.keyboard.createCursorKeys();

        this.time.events.repeat(Phaser.Timer.SECOND * SPAWN_TIME, Infinity, this.spawnSomething, this);
        this.time.events.repeat(Phaser.Timer.SECOND * NUT_TIME, Infinity, this.shoot, this);
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

        this.tree.tilePosition.y += this.time.physicsElapsed * TREE_SPEED;

        this.physics.arcade.overlap(this.bullets, this.enemies, this.bulletCollisionHandler, null, this);
        this.physics.arcade.overlap(this.squirrel, this.powerups, this.collectPowerUp, null, this);
        this.physics.arcade.overlap(this.squirrel, this.enemies, this.squirrelCollisionHandler, null, this);
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
                func: function() {},
                weight: 1000,
            }
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
        var lolli = this.powerups.create(
            (this.game.width - this.cache.getImage('lolli').width) * Math.random(),
            -this.cache.getImage('lolli').height,
            'lolli'
        );
        this.game.physics.arcade.enable(lolli);
        lolli.body.velocity.y = TREE_SPEED;
        lolli.data.type = POWER_UP_TYPES.LOLLI;
    },
    spawnNugget: function() {
        var nugget = this.powerups.create(
            (this.game.width - this.cache.getImage('nugget').width) * Math.random(),
            -this.cache.getImage('nugget').height,
            'nugget'
        );
        this.game.physics.arcade.enable(nugget);
        nugget.body.velocity.y = TREE_SPEED;
        nugget.data.type = POWER_UP_TYPES.NUGGET;
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
            case SQUIRREL_MODE.NUTS:
                this.spawnNut();
            break;
            case SQUIRREL_MODE.GRENADE:
                this.spawnGrenade();
            break;
        }
    },
    spawnGrenade: function() {
        var grenade = this.bullets.create(
            this.squirrel.body.position.x,
            this.squirrel.position.y - 48,
            'grenade'
        );

        grenade.animations.add('circle', [0, 1, 2, 3, 4, 5, 6], 20, true);
        grenade.animations.play('circle');

        grenade.body.checkCollision.up = true;
        grenade.body.velocity.y = -BULLET_SPEED;
        grenade.killOutOfBounds = true;
        grenade.data.type = BULLET_TYPES.GRENADE;
    },
    spawnNut: function() {
        var nut = this.bullets.create(
            this.squirrel.body.position.x + this.cache.getImage('nut').width / 2,
            this.squirrel.position.y - this.cache.getImage('nut').height,
            'nut'
        );

        nut.body.checkCollision.up = true;
        nut.body.velocity.y = -BULLET_SPEED;
        nut.killOutOfBounds = true;
        nut.data.type = BULLET_TYPES.NUT;
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
            this.sawFrequency += 5;

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
                this.game.time.events.add(Phaser.Timer.SECOND * POWER_UP_TIME, this.normalizeMode, this);
            break;
            case POWER_UP_TYPES.NUGGET:
                this.showHint(squirrel, 'I LUVE NUGGETS');
                this.score += 5000;
            break;
        }
    },
    normalizeMode: function() {
        this.squirrel.data.mode = SQUIRREL_MODE.NUTS;
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
        this.squirrel.animations.stop(null, true);
    },
    render: function() {
        if(DEBUG) {
            this.enemies.forEachAlive(function(enemy) { 
                this.game.debug.body(enemy);
            }.bind(this));
            this.game.debug.body(this.squirrel);
        }
    }
};

var game = new Phaser.Game(
    320,
    680,
    Phaser.CANVAS,
    '', 
    state
);
