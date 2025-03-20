/*
 * @Author: Leo Ding <leoding86@msn.com>
 * @Date: 2025-03-18 09:05:51
 * @LastEditors: Leo Ding <leoding86@msn.com>
 * @LastEditTime: 2025-03-20 15:45:03
 */
class ScalableContainer {
  minScale = 0.3;

  maxScale = 3;

  frame: HTMLElement;

  frameWidth: number;

  frameHeight: number;

  frameRatio: number;

  content: HTMLElement;

  contentWidth: number;

  contentHeight: number;

  contentRatio: number;

  lastTouchPoints: TouchList|null = null;

  midPoint: {x: number, y: number} = { x: 0, y: 0 };

  lastPointsDistance = 0;

  translateX = 0;

  translateY = 0;

  scale = 1;

  transformOrigin = { x: 0, y: 0 };

  lastSingleTouchstartTime = 0;

  wheelThrottlingTime = 300;

  lastWheelEffectTime = 0;

  scaleAnimationTime = 0;

  scaleSpeed = 300;

  scaleAnimationRunning = false;

  mouseInvoked = false;

  constructor(options: { frame: string, content: string, initScale?: number, minScale?: number, maxScale?: number }) {
    this.frame = document.querySelector(options.frame) as HTMLElement;
    const frameRect = this.frame.getBoundingClientRect();
    this.frameWidth = frameRect.width;
    this.frameHeight = frameRect.height;
    this.frameRatio = this.frameWidth / this.frameHeight;
    this.frame.style.position = 'relative';

    this.content = document.querySelector(options.content) as HTMLElement;
    const contentRect = this.content.getBoundingClientRect();
    this.contentWidth = contentRect.width;
    this.contentHeight = contentRect.height;
    this.contentRatio = this.contentWidth / this.contentHeight;
    this.content.style.position = 'absolute';
    this.content.style.top = '0';
    this.content.style.left = '0';
    this.transformOrigin = {
      x: this.contentWidth / 2,
      y: this.contentHeight / 2
    };

    if (options.minScale) this.minScale = options.minScale;
    if (options.maxScale) this.maxScale = options.maxScale;
    if (options.initScale) this.scale = options.initScale;

    this.init();
  }

  init() {
    this.content.addEventListener('touchstart', this.handleTouchstart.bind(this));
    this.content.addEventListener('touchmove', this.handleTouchmove.bind(this));
    this.content.addEventListener('touchend', this.handleTouchend.bind(this));
    this.content.addEventListener('touchcancel', this.handleTouchcancel.bind(this));
    this.content.addEventListener('transitionend', this.handleTransitionend.bind(this));
    this.content.addEventListener('wheel', this.handleWheel.bind(this));
    this.content.addEventListener('mousedown', this.handleMousedown.bind(this));
    this.content.addEventListener('mousemove', this.handleMousemove.bind(this));
    this.content.addEventListener('mouseup', this.handleMouseup.bind(this));
    this.initPosition();
    this.render();
  }

  unload() {
    this.content.removeEventListener('touchstart', this.handleTouchstart);
    this.content.removeEventListener('touchmove', this.handleTouchmove);
    this.content.removeEventListener('touchend', this.handleTouchend);
    this.content.removeEventListener('touchcancel', this.handleTouchcancel);
    this.content.removeEventListener('transitionend', this.handleTransitionend);
    this.content.removeEventListener('wheel', this.handleWheel);
    this.content.removeEventListener('mousedown', this.handleMousedown);
    this.content.removeEventListener('mousemove', this.handleMousemove);
    this.content.removeEventListener('mouseup', this.handleMouseup);
  }

  initPosition() {
    this.translateX = -(this.contentWidth - this.frameWidth) / 2;
    this.translateY = -(this.contentHeight - this.frameHeight) / 2;
  }

  getContentRect() {
    return this.content.getBoundingClientRect();
  }

  moveDistance(touches: TouchList) {
    const distance = {x: 0, y: 0};

    if (this.lastTouchPoints) {
      if (this.lastTouchPoints.length === 1 || touches.length === 1) {
        distance.x = touches[0].clientX - this.lastTouchPoints[0].clientX;
        distance.y = touches[0].clientY - this.lastTouchPoints[0].clientY;
      } else if (this.lastTouchPoints.length > 1) {
        distance.x = (touches[0].clientX - this.lastTouchPoints[0].clientX +
          touches[1].clientX - this.lastTouchPoints[1].clientX) / 2;
        distance.y = (touches[0].clientY - this.lastTouchPoints[0].clientY +
          touches[1].clientY - this.lastTouchPoints[1].clientY) / 2;
      }
    }

    this.translateX += distance.x;
    this.translateY += distance.y;
  }

  getPointsDistance(touches: TouchList) {
    const x = Math.abs(touches[0].clientX - touches[1].clientX);
    const y = Math.abs(touches[0].clientY - touches[1].clientY);
    return Math.sqrt(x * x + y * y);
  }

  getMidPoint(touches: TouchList) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  getTransformOrigin(point: { x: number, y: number }) {
    const contentRect = this.content.getBoundingClientRect();
    return {
      x: (point.x - contentRect.left) / this.scale,
      y: (point.y - contentRect.top) / this.scale
    };
  }

  getContentOffset() {
    const contentRect = this.content.getBoundingClientRect();
    const frameRect = this.frame.getBoundingClientRect();

    return {
      offsetX: contentRect.left - frameRect.left,
      offsetY: contentRect.top - frameRect.top
    };
  }

  moveScale(touches: TouchList) {
    if (this.lastTouchPoints && this.lastTouchPoints.length > 1 && touches.length > 1) {
      const currentPointsDistance = this.getPointsDistance(touches);
      this.scale = this.scale * currentPointsDistance / this.lastPointsDistance;
      this.lastPointsDistance = currentPointsDistance;
      this.midPoint = this.getMidPoint(touches);
    }
  }

  adjustTranslates(lastTransformOrigin: { x: number, y: number }) {
    // Adjust the translates issued by transform origin changes
    const contentRect = this.content.getBoundingClientRect();
    this.translateX += (this.transformOrigin.x - lastTransformOrigin.x) * (contentRect.height - this.contentHeight) / this.contentWidth;
    this.translateY += (this.transformOrigin.y - lastTransformOrigin.y) * (contentRect.height - this.contentHeight) / this.contentHeight;
  }

  handleWheel(evt: WheelEvent) {
    const nowTime = Date.now();

    if (nowTime - this.lastWheelEffectTime >= this.wheelThrottlingTime) {
      const lastTransformOrigin = this.transformOrigin;
      this.transformOrigin = this.getTransformOrigin({
        x: evt.clientX,
        y: evt.clientY
      });

      this.adjustTranslates(lastTransformOrigin);

      let scale = 1;

      if (evt.deltaY < 0) {
        scale = Math.min(this.scale * 2, this.maxScale);
      } else if (evt.deltaY > 0) {
        scale = Math.max(this.scale * .5, this.minScale);
      }

      this.animateToScale({ scale });
      this.lastWheelEffectTime = nowTime;
    }
  }

  handleTouchstart(evt: TouchEvent) {
    this.lastTouchPoints = evt.touches;
    const lastTransformOrigin = this.transformOrigin;

    if (evt.touches.length === 1) {
      // Simulate double-tap scaling
      const nowTime = Date.now();
      if (!this.lastSingleTouchstartTime) {
        this.lastSingleTouchstartTime = nowTime;
      } else {
        if (nowTime - this.lastSingleTouchstartTime < 300) {
          this.transformOrigin = this.getTransformOrigin({
            x: evt.touches[0].clientX,
            y: evt.touches[0].clientY
          });
          this.adjustTranslates(lastTransformOrigin);
          this.animateToScale({ scale: Math.min(this.scale * 2, this.maxScale) });
        }

        this.lastSingleTouchstartTime = nowTime;
      }
    } else if (evt.touches.length > 1) {
      this.lastPointsDistance = this.getPointsDistance(evt.touches);
      this.midPoint = this.getMidPoint(evt.touches);
      this.transformOrigin = this.getTransformOrigin(this.midPoint);

      // Adjust the translates issued by transform origin changes
      this.adjustTranslates(lastTransformOrigin);
    }

    evt.stopPropagation();
    return false;
  }

  handleTouchmove(evt: TouchEvent) {
    if (!this.lastTouchPoints || this.lastTouchPoints.length === 0) {
      this.lastTouchPoints = evt.touches;
      return;
    }

    this.moveDistance(evt.touches);
    this.moveScale(evt.touches);
    this.lastTouchPoints = evt.touches;

    this.render();

    evt.preventDefault();
    evt.stopPropagation();
    return false;
  }

  handleTouchend({ touches }: TouchEvent) {
    if (touches.length === 0) {
      this.renderAfterTouchend();
    }

    this.lastTouchPoints = null;
  }

  handleTouchcancel() {
    this.renderAfterTouchend();
  }

  covertMouseEventToTouchEvent(evt: MouseEvent, type: string): TouchEvent {
    return new TouchEvent(type, {
      touches: [
        new Touch({
          identifier: Date.now(),
          target: evt.target as HTMLElement,
          clientX: evt.clientX,
          clientY: evt.clientY,
          screenX: evt.screenX,
          screenY: evt.screenY,
          pageX: evt.pageX,
          pageY: evt.pageY
        })
      ]
    });
  }

  handleMousedown(evt: MouseEvent) {
    this.mouseInvoked = true;
    this.handleTouchmove(this.covertMouseEventToTouchEvent(evt, 'touchstart'));
  }

  handleMousemove(evt: MouseEvent) {
    if (this.mouseInvoked === false) return;
    this.handleTouchmove(this.covertMouseEventToTouchEvent(evt, 'touchmove'));
  }

  handleMouseup(evt: MouseEvent) {
    this.mouseInvoked = false;
    this.handleTouchend(this.covertMouseEventToTouchEvent(evt, 'touchend'));
  }

  handleTransitionend() {
    //
  }

  renderAfterTouchend() {
    if (this.scale < this.minScale) {
      this.scale = this.minScale;
      this.render();
    }
  }

  handleContentTransitionEnd() {
    this.content.style.removeProperty('transition');
    this.content.removeEventListener('transitionend', this.handleContentTransitionEnd);
    this.content.removeEventListener('transitioncancel', this.handleContentTransitionEnd);
  }

  render(options?: { animation: boolean }) {
    if (options?.animation) {
      this.content.style.transition = 'all .3s';
      this.content.addEventListener('transitionend', this.handleContentTransitionEnd.bind(this));
      this.content.addEventListener('transitioncancel', this.handleContentTransitionEnd.bind(this));
    }

    let scale = Math.min(this.maxScale, Math.max(this.minScale, this.scale));
    this.content.style.transform = `translate(${this.translateX}px, ${this.translateY}px) ` +
      `scale(${scale})`;
    this.content.style.transformOrigin = `${this.transformOrigin.x}px ${this.transformOrigin.y}px`;

    this.finishRender();
  }

  finishRender() {
    const frameRect = this.frame.getBoundingClientRect();
    const contentOffset = this.getContentOffset();
    let contentWidth = this.contentWidth * this.scale;
    let contentHeight = this.contentHeight * this.scale;

    if (contentWidth <= frameRect.width) {
      this.transformOrigin.x = this.contentWidth / 2;
      this.translateX = (this.frameWidth - this.contentWidth) / 2;
    } else {
      let targetOffsetX = contentOffset.offsetX;

      if (targetOffsetX >= 0) {
        this.translateX -= targetOffsetX;
      } else if ((this.frameWidth - targetOffsetX) > contentWidth) {
        this.translateX += this.frameWidth - targetOffsetX - contentWidth;
      }
    }

    if (contentHeight <= frameRect.height) {
      this.transformOrigin.y = this.contentHeight / 2;
      this.translateY = (this.frameHeight - this.contentHeight) / 2;
    } else {
      let targetOffsetY = contentOffset.offsetY;

      if (targetOffsetY >= 0) {
        this.translateY -= targetOffsetY;
      } else if ((this.frameHeight - targetOffsetY) > contentHeight) {
        this.translateY += this.frameHeight - targetOffsetY - contentHeight;
      }
    }

    this.content.style.transform = `translate(${this.translateX}px, ${this.translateY}px) ` +
      `scale(${this.scale})`;
    this.content.style.transformOrigin = `${this.transformOrigin.x}px ${this.transformOrigin.y}px`;
  }

  animateToScale({ scale }: { scale: number }) {
    if (this.scaleAnimationRunning === true) return;
    this.scaleAnimationRunning = true;

    requestAnimationFrame((t) => {
      this.runScaleAnimation({ scale, t });
    });
  }

  runScaleAnimation({ scale, t }: { scale: number,  t: number }) {
    if (!this.scaleAnimationTime) {
      this.scaleAnimationTime = t
      requestAnimationFrame((t) => {
        this.runScaleAnimation({ scale, t });
      });
      return;
    }

    const escapedTime = Math.min(this.scaleSpeed, t - this.scaleAnimationTime);
    this.scale = Math.min(this.scale + escapedTime / this.scaleSpeed * (scale - this.scale), this.maxScale);
    this.render();

    if (escapedTime >= this.scaleSpeed) {
      this.scaleAnimationTime = 0;
      this.scaleAnimationRunning = false;
      return;
    } else {
      requestAnimationFrame((t) => {
        this.runScaleAnimation({ scale, t});
      });
    }
  }
}

export { ScalableContainer };