import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PixiPlugin } from "gsap/PixiPlugin";

gsap.registerPlugin(ScrollTrigger, PixiPlugin);

const Actions = {
  stand1: {
    delay: 500,
  },
  walk1: {
    delay: 200,
  },
};
class WorldCamera {
  constructor(viewport) {
    this.viewport = viewport;
    this.initX = viewport.center.x;
    this.initY = viewport.center.y;
  }
  get x() {
    return this.viewport.center.x - this.initX;
  }
  get y() {
    return this.viewport.center.y - this.initY;
  }
  set x(value) {
    this.viewport.moveCenter(value + this.initX, this.y + this.initY);
  }
  set y(value) {
    this.viewport.moveCenter(this.x + this.initX, value + this.initY);
  }
  set position(point) {
    this.viewport.moveCenter(point.x + this.initX, point.y + this.initY);
  }
}

function createGradient(quality = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = quality;
  canvas.height = 1;

  const ctx = canvas.getContext("2d");

  const grd = ctx.createLinearGradient(0, 0, quality, 0);
  grd.addColorStop(0, "rgba(255, 255, 255, 0.0)");
  grd.addColorStop(0.5, "cyan");
  grd.addColorStop(1, "red");

  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, quality, 1);

  return PIXI.Texture.from(canvas);
}

function updateCharacterState(character, assets, state = "stand1") {
  character.state = state;
  character.removeChildren();
  console.log(assets.spritesheet.animations[state]);
  const $currentAnimation = new PIXI.AnimatedSprite(
    assets.spritesheet.animations[state]
  );
  $currentAnimation.loop = true;
  $currentAnimation.playing = true;
  $currentAnimation.animationSpeed = 1 / ((Actions[state].delay || 200) / 16);
  character.addChild($currentAnimation);
  $currentAnimation.play();
}

class Project {
  constructor(canvas) {
    this.viewWidth = 800;
    this.viewHeight = 600;
    this.worldWidth = 2000;
    this.worldHeight = 2000;

    this.$app = new PIXI.Application({
      width: this.viewWidth,
      height: this.viewHeight,
      backgroundColor: 0xffffff,
      antialias: true,
      view:
        typeof canvas === "string" ? document.querySelector(canvas) : canvas,
    });
    this.$viewport = new Viewport({
      screenWidth: this.viewWidth,
      screenHeight: this.viewHeight,
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight,
      interaction: this.$app.renderer.plugins.interaction,
    });
    this.scene = {
      $scene: new PIXI.Container(),
    };

    this.$viewport.camera = new WorldCamera(this.$viewport);
    this.$viewport.addChild(this.scene.$scene);
    this.$app.stage.addChild(this.$viewport);
  }
  init() {
    // maybe more assets
    this.$app.loader
      .add("character", "/assets/character/testsprite.json")
      .load(this.loaded);
  }
  loaded = () => {
    this.$character = this.createCharacter("character");
    this.$floor = this.createFloor();
    this.$character.position.set(
      0,
      this.viewHeight - this.$floor.height - this.$character.height / 2
    );
    this.scene.$scene.addChild(this.$floor, this.$character);

    this.bindScrollTrigger(this.$viewport.camera, 0, "+=2000", {
      x: this.worldWidth - this.viewWidth,
    });
    this.bindScrollTrigger(
      this.$character,
      0,
      "+=2000",
      { x: this.worldWidth - Math.abs(this.$character.width) * 2 },
      (self) => {
        this.$character.scale.x = self.direction * -1;
      }
    );
    ScrollTrigger.addEventListener("scrollStart", () => {
      this.updateCharacterState(this.$character, "character", "walk1");
    });
    ScrollTrigger.addEventListener("scrollEnd", () => {
      this.updateCharacterState(this.$character, "character");
    });
  };
  bindScrollTrigger(obj, start = 0, end, transitions, onUpdate) {
    const scrollTrigger = {
      trigger: "#app",
      pin: true,
      start: start,
      end: end,
      scrub: true,
    };
    if (onUpdate) {
      scrollTrigger.onUpdate = onUpdate;
    }
    gsap.to(obj, {
      ...transitions,
      scrollTrigger,
    });
  }
  createFloor() {
    const $floor = new PIXI.Sprite(createGradient(this.worldWidth));
    $floor.height = 50;
    $floor.position.set(0, this.viewHeight - $floor.height);
    return $floor;
  }
  createCharacter(assetsName) {
    const $character = new PIXI.Container();
    $character.pivot.set(0, 0);
    this.updateCharacterState($character, assetsName);
    $character._flip = 1;
    $character.scale.x = -1;
    return $character;
  }
  updateCharacterState(character, assetsName, state = "stand1") {
    updateCharacterState(
      character,
      this.$app.loader.resources[assetsName],
      state
    );
  }
}

new Project("#app").init();
