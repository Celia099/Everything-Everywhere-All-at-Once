(function attachInput(global) {
  'use strict';

  var utils = global.ULEAP_UTILS;

  function InputController(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.skillQueued = false;
    this.movePointerId = null;
    this.skillCandidate = null;
    this.touchVector = { x: 0, y: 0 };
    this.dragState = {
      originX: 0,
      originY: 0,
      currentX: 0,
      currentY: 0
    };
    this.skillButton = {
      x: config.logicWidth - config.uiEdgePadding - config.skillButtonRadius,
      y: config.logicHeight - config.uiEdgePadding - config.skillButtonRadius,
      radius: config.skillButtonRadius
    };
    this._bindEvents();
  }

  InputController.prototype._bindEvents = function bindEvents() {
    var self = this;

    window.addEventListener('keydown', function onKeyDown(event) {
      if (event.key === ' ' || event.code === 'Space') {
        self.skillQueued = true;
        event.preventDefault();
      }
    });

    this.canvas.addEventListener('pointerdown', function onPointerDown(event) {
      var pos = self._eventToCanvas(event);
      if (!pos) {
        return;
      }

      if (typeof self.canvas.setPointerCapture === 'function') {
        self.canvas.setPointerCapture(event.pointerId);
      }

      if (utils.distance(pos.x, pos.y, self.skillButton.x, self.skillButton.y) <= self.skillButton.radius) {
        self.skillCandidate = {
          pointerId: event.pointerId,
          startX: pos.x,
          startY: pos.y
        };
      }

      if (self.movePointerId === null) {
        self.movePointerId = event.pointerId;
        self.dragState.originX = pos.x;
        self.dragState.originY = pos.y;
        self.dragState.currentX = pos.x;
        self.dragState.currentY = pos.y;
        self._updateDragVector(pos.x, pos.y);
      }
      event.preventDefault();
    });

    this.canvas.addEventListener('pointermove', function onPointerMove(event) {
      var pos = self._eventToCanvas(event);
      if (!pos) {
        return;
      }

      if (self.movePointerId === event.pointerId) {
        self._updateDragVector(pos.x, pos.y);
        event.preventDefault();
      }

      if (self.skillCandidate && self.skillCandidate.pointerId === event.pointerId) {
        if (utils.distance(pos.x, pos.y, self.skillCandidate.startX, self.skillCandidate.startY) > self.config.skillTapMaxMove) {
          self.skillCandidate = null;
        }
      }
    });

    this.canvas.addEventListener('pointerup', function onPointerEnd(event) {
      self._finalizeSkillCandidate(event);
      self._releasePointer(event.pointerId);
    });

    this.canvas.addEventListener('pointercancel', function onPointerCancel(event) {
      self._releasePointer(event.pointerId);
    });
  };

  InputController.prototype._eventToCanvas = function eventToCanvas(event) {
    var rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    return {
      x: (event.clientX - rect.left) * (this.config.logicWidth / rect.width),
      y: (event.clientY - rect.top) * (this.config.logicHeight / rect.height)
    };
  };

  InputController.prototype._updateDragVector = function updateDragVector(x, y) {
    var dx = x - this.dragState.originX;
    var dy = y - this.dragState.originY;
    var len = utils.length(dx, dy);
    var max = this.config.dragReferenceRadius;
    var deadZone = this.config.touchDeadZone;
    var nx = 0;
    var ny = 0;
    var clampedX = 0;
    var clampedY = 0;

    if (len > deadZone) {
      nx = dx / len;
      ny = dy / len;
      clampedX = len > max ? nx * max : dx;
      clampedY = len > max ? ny * max : dy;
    }

    this.touchVector.x = len > deadZone ? nx : 0;
    this.touchVector.y = len > deadZone ? ny : 0;
    this.dragState.currentX = this.dragState.originX + clampedX;
    this.dragState.currentY = this.dragState.originY + clampedY;
  };

  InputController.prototype._finalizeSkillCandidate = function finalizeSkillCandidate(event) {
    var pos;
    if (!this.skillCandidate || this.skillCandidate.pointerId !== event.pointerId) {
      return;
    }

    pos = this._eventToCanvas(event);
    if (
      pos &&
      utils.distance(pos.x, pos.y, this.skillCandidate.startX, this.skillCandidate.startY) <= this.config.skillTapMaxMove &&
      utils.distance(pos.x, pos.y, this.skillButton.x, this.skillButton.y) <= this.skillButton.radius
    ) {
      this.skillQueued = true;
    }
    this.skillCandidate = null;
  };

  InputController.prototype._releasePointer = function releasePointer(pointerId) {
    if (this.movePointerId === pointerId) {
      this.movePointerId = null;
      this.touchVector.x = 0;
      this.touchVector.y = 0;
      this.dragState.currentX = this.dragState.originX;
      this.dragState.currentY = this.dragState.originY;
    }

    if (this.skillCandidate && this.skillCandidate.pointerId === pointerId) {
      this.skillCandidate = null;
    }
  };

  InputController.prototype.getMoveVector = function getMoveVector() {
    return {
      x: this.touchVector.x,
      y: this.touchVector.y
    };
  };

  InputController.prototype.consumeSkill = function consumeSkill() {
    if (!this.skillQueued) {
      return false;
    }
    this.skillQueued = false;
    return true;
  };

  global.ULEAP_InputController = InputController;
})(window);
