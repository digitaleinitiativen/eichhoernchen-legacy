var SQUIRREL_SPEED = 200;
var TREE_SPEED = 3;

var state = {
    preload: function() {
        this.load.spritesheet('squirrel', 'assets/squirrel-spritesheet.png', 48, 96);
        this.load.image('tree', 'assets/tree.png');
        this.load.image('bird', 'assets/bird.png');
    },
    create: function() {
        this.tree = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'tree');
        this.squirrel = this.add.sprite(this.world.width / 2, this.world.height - 150, 'squirrel');
        this.squirrel.animations.add('run', [0, 1, 2, 3, 2, 1], 20, true);
        this.squirrel.animations.play('run');

        this.birds = this.add.group();

        this.game.physics.enable(this.squirrel);

        this.cursors = game.input.keyboard.createCursorKeys();

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

        var obj = this;
        this.birds.forEachAlive(function(bird) {
            if(bird.body.y > obj.game.height) {
                bird.kill();
                obj.spawnBird();
            }
        });
    },
    spawnBird: function() {
        var bird = this.birds.create(
            (this.game.width - 96) * Math.random(),
            -96,
            'bird'
        );
        this.game.physics.arcade.enable(bird);
        bird.body.velocity.y = 300;
    }
};

var game = new Phaser.Game(
    320,
    680,
    Phaser.CANVAS,
    '', 
    state
);
