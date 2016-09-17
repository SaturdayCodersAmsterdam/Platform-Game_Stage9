/**
 * The game's global configuration.
 */
var Smc = {
    // The Phaser event handlers. Keys are event names, and values are arrays of functions that take no arguments.
    phaserEventHandlers: {
        preload: [],
        create: [],
        update: []
    },
    playerTypes: {}
};

var game = new Phaser.Game(640,480, Phaser.AUTO, 'world', {
    preload: buildPhaserEventHandler("preload"),
    create: buildPhaserEventHandler("create"),
    update: buildPhaserEventHandler("update")
});

/**
 * A game player.
 *
 * @param {string} name
 * @param {Phaser.Sprite} phaserObject
 * @constructor
 */
Smc.playerTypes.Player = function (name, phaserObject) {
    this._defense = 1;
    this._name = name;
    this._isMovingVertically = false;
    this._phaserObject = phaserObject;
    game.physics.arcade.enable(this._phaserObject);
    this._phaserObject.animations.add('front', ['front1', 'front2', 'front3', 'front4', 'front5', 'front6', 'front7', 'front8', 'front9']);
    this._phaserObject.animations.add('left', ['left1', 'left2', 'left3', 'left4', 'left5', 'left6', 'left7', 'left8', 'left9']);
    this._phaserObject.animations.add('right', ['right1', 'right2','right3', 'right4','right5', 'right6','right7', 'right8', 'right9']);
    this._phaserObject.body.gravity.set(0, 180);
    this._phaserObject.body.collideWorldBounds = true;
    this._phaserObject.anchor.setTo(0.5, 0.5);

    this._weaponMountPhaserObject = game.add.sprite( 600,480, 'pixel');
    game.physics.arcade.enable(this._weaponMountPhaserObject);
    this._weaponMountPhaserObject.body.enable          = true;
    this._weaponMountPhaserObject.body.allowRotation   = true;

    //  Creates 30 bullets, using the 'bullet' graphic
    this._weaponPhaserObject = game.add.weapon(30, 'bullet');
    game.physics.arcade.enable(this._weaponPhaserObject);
    //  The bullet will be automatically killed when it leaves the world bounds
    this._weaponPhaserObject.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    //  The speed at which the bullet is fired
    this._weaponPhaserObject.bulletSpeed = 600;
    //  Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
    this._weaponPhaserObject.fireRate = 100;
    //  Tell the Weapon to track the player
    //  With no offsets from the position
    //  But the 'true' argument tells the weapon to track sprite rotation
    this._weaponPhaserObject.trackSprite(this._weaponMountPhaserObject, 0, 0, true);


    this._id                  = 1;
    this._phaserObject.maxHealth = 100;
    this._phaserObject.health= 100;
    this._phaserObject.hud = Phaser.Plugin.HUDManager.create(this._phaserObject.game, this._phaserObject, 'smc.player.hud.' + this._id);
    this._healthHud           =this._phaserObject.hud.addBar(0, -20, 32, 2, this._phaserObject.maxHealth, 'health', this._phaserObject, Phaser.Plugin.HUDManager.HEALTHBAR, false);
    this._healthHud.bar.anchor.setTo(0.5, 0.5);
    this._phaserObject.addChild(this._healthHud.bar);

    game.physics.arcade.enable(this._phaserObject)

    // Set up the trail blaze.
    this._trailBlazeEmitter = game.add.emitter(game.world.centerX, game.world.centerY, 400);
    this._trailBlazeEmitter.makeParticles( [ 'fire1', 'fire2', 'fire3', 'smoke' ] );
    this._trailBlazeEmitter.gravity = 800;
    this._trailBlazeEmitter.setAlpha(1, 0, 3000);

    // Ensure the character itself is never hidden by the other sprites that belong to it.
    this._phaserObject.bringToTop();
}

Smc.playerTypes.Player.prototype = {

    __proto__: Object.prototype,

    /**
     * Hits the player.
     */
    hit: function() {
        this._phaserObject.health = this._phaserObject.health - (10 / this._defense);
        if  (this._phaserObject.health<=0){
            this._kill();
        }
    },

    /**
     * Kills the player.
     */
    _kill: function() {
        this._phaserObject.health = 0;
        this._phaserObject.kill();
    },

    /**
     * Moves the player to the left.
     */
    moveLeft: function() {
        if (this._isMovingVertically) {
            this._phaserObject.x = this._phaserObject.x - 10;
        } else {
            this._phaserObject.x = this._phaserObject.x - 5;
        }
        this._phaserObject.animations.play('left', 2, true);
        this._weaponMountPhaserObject.angle = 180;
        this._onMove();
    },

    /**
     * Moves the player to the right.
     */
    moveRight: function() {
        if (this._isMovingVertically) {
            this._phaserObject.x = this._phaserObject.x + 10;
        } else {
            this._phaserObject.x = this._phaserObject.x + 5;
        }
        this._phaserObject.animations.play('right', 2, true);
        this._weaponMountPhaserObject.x = x;
        this._weaponMountPhaserObject.angle = 0;
        this._onMove();
    },

    /**
     * Moves the player upwards.
     */
    moveUp: function() {
        this._isMovingVertically = true;
        this._phaserObject.y = this._phaserObject.y - 10;
        this._phaserObject.animations.play('front', 2, true);
        this._weaponMountPhaserObject.angle = 270;
        this._onMove();
        this._isMovingVertically = false;
    },

    /**
     * Moves the player downwards.
     */
    moveDown: function() {
        this._isMovingVertically = true;
        this._phaserObject.y = this._phaserObject.y + 10;
        this._phaserObject.animations.play('front', 2, true);
        this._weaponMountPhaserObject.angle = 90;
        this._onMove();
        this._isMovingVertically = false;
    },

    /**
     * Responds to player movement.
     */
    _onMove: function() {
        // Show the trail blaze.
        var trailBlazeVelocityX = this._phaserObject.body.velocity.x * -1;
        var trailBlazeVelocityY = this._phaserObject.body.velocity.y * -1;
        this._trailBlazeEmitter.minParticleSpeed.set(trailBlazeVelocityX, trailBlazeVelocityY);
        this._trailBlazeEmitter.maxParticleSpeed.set(trailBlazeVelocityX, trailBlazeVelocityY);
        this._trailBlazeEmitter.emitX = this._phaserObject.x;
        this._trailBlazeEmitter.emitY = this._phaserObject.y;
        this._trailBlazeEmitter.setScale(0.1,0, 0.1,0, 3000);
        this._trailBlazeEmitter.start(true, 100, null, 5);
    },

    /**
     * Fires the player's weapon.
     */
    fireWeapon: function() {
        // It appears to be impossible to reposition the weapon as soon as the character is moved through game forces such
        // as gravity, so do we do it here, where it actually matters.
        this._weaponMountPhaserObject.y =   this._phaserObject.y;
        this._weaponMountPhaserObject.x =   this._phaserObject.x;
        this._weaponPhaserObject.fire();
    }

};

Smc.playerTypes.Student = function() {
    Smc.playerTypes.Player.call(this, "student", game.add.sprite(600,480, 'student'));
};
Smc.playerTypes.Student.prototype = {
    __proto__: Smc.playerTypes.Player.prototype,
};

Smc.playerTypes.Mexican = function() {
    Smc.playerTypes.Player.call(this, "mexican", game.add.sprite( mexicanX, mexicanY, 'mexican'));
    this._phaserObject.body.immovable      = true;
};
Smc.playerTypes.Mexican.prototype = {
    __proto__: Smc.playerTypes.Player.prototype,
};

/**
 * Builds a Phaser event handler for a specific event.
 *
 * @param {string} eventName
 *   The name of the event to create the handler for. Must exist as a key in Smc.eventHandlers.
 *
 * @returns {Function}
 *   The event handler, which takes no arguments.
 */
function buildPhaserEventHandler(eventName) {
    // Phaser callbacks are functions that take no arguments. We create them dynamically using the event name that was
    // passed on to this builder function.
    return function() {
        Smc.phaserEventHandlers[eventName].forEach(function (handler) {
            handler();
        });
    }
}

var cursors;

var mexicanX = 200;
var mexicanY= 100;
var boxX = 200;
var boxY = 250;
var liftX = 400;
var liftY = 250;
var lift ;
var mexican;

var armX = 46;
var armY= 93;
var pumpX = 62;
var pumpY= 168;
var weightX = 0;
var weightY= 345;

var x = game.width/2;
var y = game.height/2;

Smc.phaserEventHandlers.preload.push(function() {
    game.load.image('arm', 'assets/arm.png');
    game.load.image('pump', 'assets/pump.png');
    game.load.image('weight', 'assets/weight.png');

    game.load.image('fire1', 'assets/fire1.png');
    game.load.image('fire2', 'assets/fire2.png');
    game.load.image('fire3', 'assets/fire3.png');
    game.load.image('smoke', 'assets/smoke-puff.png');

    game.load.image('pixel', 'assets/trans-pixel.png');

    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('box', 'assets/box.png');
    game.load.image('lift', 'assets/lift.png');
    game.load.image('background', 'assets/header.jpg');
    game.load.atlasJSONHash('student', 'assets/student.png','assets/student.json');
    game.load.atlasJSONHash('mexican', 'assets/mexican.png', 'assets/mexican.json');

    game.load.image('pixel', 'assets/trans-pixel.png');
    game.load.script('HudManager', 'plugins/HUDManager.js');
});

Smc.phaserEventHandlers.create.push(function() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = '#333';
    game.add.tileSprite(-400,-400, 2000, 1600, 'background');

    student = new Smc.playerTypes.Student();
    mexican = new Smc.playerTypes.Mexican();

    box = game.add.sprite( boxX, boxY, 'box');
    lift = game.add.sprite( liftX, liftY, 'lift');


    pump = game.add.sprite( pumpX, pumpY, 'pump');
    arm = game.add.sprite( armX, armY, 'arm');
    weight = game.add.sprite( weightX, weightY, 'weight');

    game.physics.arcade.enable(box);
    game.physics.arcade.enable(lift);
    lift.body.collideWorldBounds = true;
    box.body.collideWorldBounds = true;

    cursors = game.input.keyboard.createCursorKeys();
});

Smc.phaserEventHandlers.update.push(function() {
    game.physics.arcade.collide(mexican._phaserObject, box);
    game.physics.arcade.collide(student._phaserObject, box);
    game.physics.arcade.collide(student._phaserObject, lift);
    game.physics.arcade.collide(mexican._phaserObject, student._weaponPhaserObject.bullets, function(mexicanPhaserObject, bulletPhaserObject) {
        mexican.hit();
        bulletPhaserObject.kill();
    }, null, this);


    if (cursors.up.isDown) {
        student.moveUp();
    }
    if (cursors.down.isDown) {
        student.moveDown();
    }
    if (cursors.left.isDown) {
        student.moveLeft();
    }
    if (cursors.right.isDown) {
        student.moveRight();
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        student.fireWeapon();
    }

});
