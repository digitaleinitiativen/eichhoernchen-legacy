var GAME_HEIGHT = 680;
var GAME_WIDTH = 320;
var SQUIRREL_SPEED = 100;

var state = {
    preload: function() {
        this.load.image('squirrel', 'assets/squirrel.png');
    },
    create: function() {
        this.squirrel = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'squirrel');
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
    }
};

var game = new Phaser.Game(
    GAME_WIDTH,
    GAME_HEIGHT,
    Phaser.CANVAS,
    '', 
    state
);
