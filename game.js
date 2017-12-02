var SQUIRREL_SPEED = 100;
var TREE_SPEED = 3;

var state = {
    preload: function() {
        this.load.image('squirrel', 'assets/squirrel.png');
        this.load.image('tree', 'assets/tree.png');
    },
    create: function() {
        this.tree = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'tree');
        this.squirrel = this.add.sprite(this.world.width / 2, this.world.height - 100, 'squirrel');
        this.game.physics.enable(this.squirrel);

        this.cursors = game.input.keyboard.createCursorKeys();
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
    }
};

var game = new Phaser.Game(
    320,
    680,
    Phaser.CANVAS,
    '', 
    state
);
