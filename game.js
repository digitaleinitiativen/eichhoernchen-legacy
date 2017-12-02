var SQUIRREL_SPEED = 200;
var TREE_SPEED = 180;
var NUT_SPEED = 300;
var NUT_TIME = 0.3;
var SPAWN_TIME = 1;


var state = {
    preload: function() {
        this.load.spritesheet('squirrel', 'assets/squirrel-spritesheet.png', 48, 96);
        this.load.image('tree', 'assets/tree.png');
        this.load.image('nut', 'assets/nut.png');
        this.load.image('bird', 'assets/bird.png');
        this.load.image('lolli', 'assets/lolli.png');
        this.load.image('explosion', 'assets/explosion.png');
    },
    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        this.tree = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'tree');
        this.squirrel = this.add.sprite(this.world.width / 2, this.world.height - 150, 'squirrel');
        this.squirrel.animations.add('run', [0, 1, 2, 3, 2, 1], 20, true);
        this.squirrel.animations.play('run');
        this.game.physics.enable(this.squirrel);

        this.birds = this.add.group();
        this.birds.enableBody = true;
        this.lollies = this.add.group();
        this.nuts = this.add.group();
        this.nuts.enableBody = true;

        this.cursors = game.input.keyboard.createCursorKeys();

        this.time.events.repeat(Phaser.Timer.SECOND * SPAWN_TIME, Infinity, this.spawnSomething, this);
        this.time.events.repeat(Phaser.Timer.SECOND * NUT_TIME, Infinity, this.spawnNut, this);
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

        this.nuts.forEachAlive(function(nut) {
            if (nut.body.y < -this.cache.getImage('nut').height) {
                nut.kill();
            }
        }.bind(this));

        this.physics.arcade.overlap(this.nuts, this.birds, this.nutCollisionHandler, null, this);
    },
    spawnSomething: function() {
        var spawnies = [this.spawnLolli.bind(this), this.spawnBird.bind(this)];
        spawnies[Math.floor(spawnies.length * Math.random())]();
    },
    spawnLolli: function() {
        var lolli = this.lollies.create(
            (this.game.width - this.cache.getImage('lolli').width) * Math.random(),
            -this.cache.getImage('lolli').height,
            'lolli'
        );
        this.game.physics.arcade.enable(lolli);
        lolli.body.velocity.y = TREE_SPEED;
    },
    spawnBird: function() {
        var bird = this.birds.create(
            (this.game.width - this.cache.getImage('bird').width) * Math.random(),
            -this.cache.getImage('bird').height,
            'bird'
        );
        
        bird.body.checkCollision.down = true;
        bird.body.velocity.y = 300;
    },
    spawnNut: function() {
        var nut = this.nuts.create(
            this.squirrel.body.position.x,
            this.squirrel.position.y - this.cache.getImage('nut').height,
            'nut'
        );

        nut.body.checkCollision.up = true;
        nut.body.velocity.y = -NUT_SPEED;
    },
    nutCollisionHandler: function(nut, bird) {
        nut.kill();
        bird.kill();
        var explosion = this.add.sprite(
            bird.body.position.x - this.cache.getImage('explosion').width / 2,
            bird.body.position.y - this.cache.getImage('explosion').height / 2,
            'explosion'
        );
        this.time.events.add(Phaser.Timer.SECOND * 0.5, function() {
            explosion.kill();
        });
    }
};

var game = new Phaser.Game(
    320,
    680,
    Phaser.CANVAS,
    '', 
    state
);
