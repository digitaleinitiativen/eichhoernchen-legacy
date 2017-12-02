var SQUIRREL_SPEED = 100;
var TREE_SPEED = 3;
var NUT_SPEED = 300;

var state = {
    preload: function() {
        this.load.spritesheet('squirrel', 'assets/squirrel-spritesheet.png', 48, 96);
        this.load.image('tree', 'assets/tree.png');
        this.load.image('nut', 'assets/nut.png');
    },
    create: function() {
        this.tree = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'tree');
        this.squirrel = this.add.sprite(this.world.width / 2, this.world.height - 150, 'squirrel');
        this.squirrel.animations.add('run', [0, 1, 2, 3, 2, 1], 20, true);
        this.squirrel.animations.play('run');
        this.nuts = this.add.group();

        this.cursors = game.input.keyboard.createCursorKeys();

        this.time.events.repeat(Phaser.Timer.SECOND * 1, Infinity, this.createNut, this);

        this.game.physics.enable(this.squirrel);
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

        this.nuts.forEachAlive(function(nut) {
            if (nut.body.y < -this.cache.getImage('nut').height) {
                nut.kill();
            }
        }.bind(this));
    },
    createNut: function() {
        var nut = this.nuts.create(
            this.squirrel.body.position.x,
            this.squirrel.position.y - this.cache.getImage('nut').height,
            'nut'
        );

        this.game.physics.enable(nut);
        nut.body.velocity.y = -NUT_SPEED;
    }
};

var game = new Phaser.Game(
    320,
    680,
    Phaser.CANVAS,
    '', 
    state
);
