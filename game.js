var SQUIRREL_SPEED = 200;
var TREE_SPEED = 3;
var NUT_SPEED = 300;
var NUT_TIME = 0.3;

var state = {
    preload: function() {
        this.load.spritesheet('squirrel', 'assets/squirrel-spritesheet.png', 48, 96);
        this.load.image('tree', 'assets/tree.png');
        this.load.image('nut', 'assets/nut.png');
        this.load.image('bird', 'assets/bird.png');
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

        this.cursors = game.input.keyboard.createCursorKeys();

        this.nuts = this.add.group();
        this.nuts.enableBody = true;

        this.cursors = game.input.keyboard.createCursorKeys();

        this.time.events.repeat(Phaser.Timer.SECOND * NUT_TIME, Infinity, this.spawnNut, this);

        this.game.physics.enable(this.squirrel);
        this.spawnBird();

    },
    update: function() {
        this.squirrel.body.velocity.x = 0;
        if (this.cursors.left.isDown) {
            this.squirrel.body.velocity.x = -SQUIRREL_SPEED;
        }
        if (this.cursors.right.isDown) {
            this.squirrel.body.velocity.x = SQUIRREL_SPEED;
        }

        this.tree.tilePosition.y += TREE_SPEED;

        this.birds.forEachAlive(function(bird) {
            if(bird.body.y > this.game.height) {
                bird.kill();
                this.spawnBird();
            }
        }.bind(this));
        this.nuts.forEachAlive(function(nut) {
            if (nut.body.y < -this.cache.getImage('nut').height) {
                nut.kill();
            }
        }.bind(this));

        this.physics.arcade.overlap(this.nuts, this.birds, this.nutCollisionHandler, null, this);
    },
    spawnBird: function() {
        var bird = this.birds.create(
            (this.game.width - 96) * Math.random(),
            -96,
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
