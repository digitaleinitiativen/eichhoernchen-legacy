var SQUIRREL_SPEED = 200;
var TREE_SPEED = 180;
var BULLET_SPEED = 300;
var NUT_TIME = 0.3;
var SPAWN_TIME = 1;
var POWER_UP_TIME = 4;

var POWER_UP_TYPES = {
    LOLLI: 1,
    NUGGET: 2
}

var SQUIRREL_MODE = {
    NUTS: 1,
    GRENADES: 2
}

var BULLET_TYPES = {
    NUT: 1,
    GRENADE: 2
}


var state = {
    preload: function() {
        this.load.spritesheet('squirrel', 'assets/squirrel-spritesheet.png', 48, 96);
        this.load.image('tree', 'assets/tree.png');
        this.load.image('nut', 'assets/nut.png');
        this.load.image('bird', 'assets/bird.png');
        this.load.image('lolli', 'assets/lolli.png');
        this.load.image('explosion', 'assets/explosion.png');
        this.load.spritesheet('grenade', 'assets/grenade.png', 48, 48);
    },
    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        this.tree = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'tree');
        this.squirrel = this.add.sprite(this.world.width / 2, this.world.height - 150, 'squirrel');
        this.squirrel.animations.add('run', [0, 1, 2, 3, 2, 1], 20, true);
        this.squirrel.animations.play('run');
        this.squirrel.data.mode = SQUIRREL_MODE.NUTS;
        this.game.physics.enable(this.squirrel);

        this.birds = this.add.group();
        this.birds.enableBody = true;
        this.powerups = this.add.group();
        this.bullets = this.add.group();
        this.bullets.enableBody = true;
        this.hints = this.add.group();

        this.cursors = game.input.keyboard.createCursorKeys();

        this.time.events.repeat(Phaser.Timer.SECOND * SPAWN_TIME, Infinity, this.spawnSomething, this);
        this.time.events.repeat(Phaser.Timer.SECOND * NUT_TIME, Infinity, this.shoot, this);
    },
    update: function() {
        this.squirrel.body.velocity.x = 0;
        if (this.cursors.left.isDown) {
            this.squirrel.body.velocity.x = -SQUIRREL_SPEED;
        }
        if (this.cursors.right.isDown) {
            this.squirrel.body.velocity.x = SQUIRREL_SPEED;
        }

        this.tree.tilePosition.y += this.time.physicsElapsed * TREE_SPEED;

        this.physics.arcade.overlap(this.bullets, this.birds, this.bulletCollisionHandler, null, this);
        this.physics.arcade.overlap(this.squirrel, this.powerups, this.collectPowerUp, null, this);
    },
    spawnSomething: function() {
        var spawnies = [this.spawnLolli.bind(this), this.spawnBird.bind(this)];
        spawnies[Math.floor(spawnies.length * Math.random())]();
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
    spawnBird: function() {
        var bird = this.birds.create(
            (this.game.width - this.cache.getImage('bird').width) * Math.random(),
            -this.cache.getImage('bird').height,
            'bird'
        );
        
        bird.body.checkCollision.down = true;
        bird.body.velocity.y = 300;
        bird.health = 100;
    },
    shoot: function() {
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
            this.squirrel.body.position.x,
            this.squirrel.position.y - this.cache.getImage('nut').height,
            'nut'
        );

        nut.body.checkCollision.up = true;
        nut.body.velocity.y = -BULLET_SPEED;
        nut.killOutOfBounds = true;
        nut.data.type = BULLET_TYPES.NUT;
    },
    bulletCollisionHandler: function(bullet, bird) {
        bullet.kill();
        switch(bullet.data.type) {
            case BULLET_TYPES.NUT: 
                bird.health -= 34;
            break;
            case BULLET_TYPES.GRENADE:
                bird.health -= 100;
            break;
        }
        if(bird.health <= 0) {
            bird.kill();
            var explosion = this.add.sprite(
                bird.body.position.x - this.cache.getImage('explosion').width / 2,
                bird.body.position.y - this.cache.getImage('explosion').height / 2,
                'explosion'
            );
            this.game.camera.shake(0.05, 500);

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
};

var game = new Phaser.Game(
    320,
    680,
    Phaser.CANVAS,
    '', 
    state
);
